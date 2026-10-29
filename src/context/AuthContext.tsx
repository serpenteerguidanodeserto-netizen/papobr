/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    city?: string;
    state?: string;
  }) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Fetch or create profile
  const fetchOrCreateProfile = async (firebaseUser: User) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        setProfile(snapshot.data() as UserProfile);
      } else {
        // Derive clean username from display name or email
        let baseUsername = (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'usuario')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 18);
        if (baseUsername.length < 3) baseUsername = 'papo_' + baseUsername;
        
        let targetUsername = baseUsername;
        // Check uniqueness
        const usernameRef = doc(db, 'usernames', targetUsername);
        const usernameSnap = await getDoc(usernameRef);
        if (usernameSnap.exists()) {
          targetUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
        }

        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Novo Usuário',
          username: targetUsername,
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUsername}`,
          coverURL: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1200&q=80',
          bio: 'Olá! Sou novo no PapoBR. 🇧🇷',
          city: 'São Paulo',
          state: 'SP',
          createdAt: new Date().toISOString(),
          friendsCount: 0,
          postsCount: 0,
          isVerified: false,
        };

        await setDoc(userRef, newProfile);
        await setDoc(doc(db, 'usernames', targetUsername), {
          username: targetUsername,
          uid: firebaseUser.uid,
          createdAt: new Date().toISOString(),
        });

        setProfile(newProfile);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchOrCreateProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      await fetchOrCreateProfile(result.user);
    }
    setIsAuthModalOpen(false);
  };

  const signUpWithEmail = async ({
    name,
    username,
    email,
    password,
    city = 'São Paulo',
    state = 'SP',
  }: {
    name: string;
    username: string;
    email: string;
    password: string;
    city?: string;
    state?: string;
  }) => {
    // Validate clean username
    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      throw new Error('O nome de usuário deve ter pelo menos 3 caracteres (apenas letras, números e _).');
    }

    // Check if username already exists
    const usernameRef = doc(db, 'usernames', cleanUsername);
    const usernameSnap = await getDoc(usernameRef);
    if (usernameSnap.exists()) {
      throw new Error(`O usuário @${cleanUsername} já está em uso no PapoBR. Por favor escolha outro.`);
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    await updateProfile(newUser, {
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
    });

    const userProfile: UserProfile = {
      uid: newUser.uid,
      displayName: name,
      username: cleanUsername,
      email,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
      coverURL: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1200&q=80',
      bio: 'Novo membro do PapoBR! 🇧🇷',
      city,
      state,
      createdAt: new Date().toISOString(),
      friendsCount: 0,
      postsCount: 0,
      isVerified: false,
    };

    await setDoc(doc(db, 'users', newUser.uid), userProfile);
    await setDoc(usernameRef, {
      username: cleanUsername,
      uid: newUser.uid,
      createdAt: new Date().toISOString(),
    });

    setProfile(userProfile);
    setIsAuthModalOpen(false);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await fetchOrCreateProfile(userCredential.user);
    }
    setIsAuthModalOpen(false);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updates);
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchOrCreateProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        resetPassword,
        logout,
        updateProfileData,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
