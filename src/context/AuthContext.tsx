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
  signInAsDemoUser: (name?: string, username?: string) => Promise<void>;
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

  // Fetch or create profile in Firestore
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
      console.warn('Erro ao carregar perfil no Firestore, criando perfil temporário:', error);
      // Fallback in case of permissions or offline
      setProfile({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'Novo Usuário',
        username: 'papo_user',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
        createdAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    // Check saved demo session if not logged in via Firebase
    const savedDemo = localStorage.getItem('papobr_demo_session');

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.removeItem('papobr_demo_session');
        await fetchOrCreateProfile(currentUser);
      } else if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo) as UserProfile;
          setUser({
            uid: parsed.uid,
            displayName: parsed.displayName,
            email: parsed.email,
            photoURL: parsed.photoURL,
          } as unknown as User);
          setProfile(parsed);
        } catch {
          setProfile(null);
          setUser(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await fetchOrCreateProfile(result.user);
      }
      setIsAuthModalOpen(false);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      console.warn('Erro ao autenticar com Google:', fbErr.code, fbErr.message);

      if (fbErr.code === 'auth/unauthorized-domain') {
        throw new Error(
          'O domínio da aplicação de teste (run.app) precisa ser adicionado no console do Firebase (Authentication > Settings > Authorized Domains). Você pode entrar agora mesmo usando a opção de E-mail/Senha ou o botão de Acesso Rápido abaixo!'
        );
      }
      if (fbErr.code === 'auth/popup-blocked') {
        throw new Error(
          'A janela pop-up do Google foi bloqueada pelo navegador. Permita pop-ups para esta página ou crie sua conta com E-mail/Senha.'
        );
      }
      if (fbErr.code === 'auth/popup-closed-by-user') {
        throw new Error('A janela de login do Google foi fechada antes da confirmação.');
      }
      if (fbErr.code === 'auth/operation-not-allowed') {
        throw new Error(
          'O login com Google não está ativado no Firebase Console. Utilize a opção de cadastro com E-mail e Senha.'
        );
      }

      throw new Error(fbErr.message || 'Não foi possível entrar com o Google. Tente novamente.');
    }
  };

  const signInAsDemoUser = async (
    name = 'Carlos Eduardo (Teste)',
    username = 'carloseduardo_br'
  ) => {
    const demoUid = 'user_' + username;
    const demoProfile: UserProfile = {
      uid: demoUid,
      displayName: name,
      username: username,
      email: `${username}@papobr.com.br`,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      coverURL:
        'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1200&q=80',
      bio: 'Explorando o PapoBR! Amante de música brasileira, futebol e boa prosa. 🇧🇷',
      city: 'Rio de Janeiro',
      state: 'RJ',
      createdAt: new Date().toISOString(),
      friendsCount: 14,
      postsCount: 3,
      isVerified: true,
    };

    // Try saving in Firestore, fallback to local state
    try {
      await setDoc(doc(db, 'users', demoUid), demoProfile, { merge: true });
    } catch (e) {
      console.warn('Registro local demo:', e);
    }

    setUser({
      uid: demoUid,
      displayName: name,
      email: `${username}@papobr.com.br`,
      photoURL: demoProfile.photoURL,
    } as unknown as User);

    setProfile(demoProfile);
    localStorage.setItem('papobr_demo_session', JSON.stringify(demoProfile));
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
    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      throw new Error('O nome de usuário deve ter pelo menos 3 caracteres.');
    }

    // Try checking uniqueness in Firestore
    try {
      const usernameRef = doc(db, 'usernames', cleanUsername);
      const usernameSnap = await getDoc(usernameRef);
      if (usernameSnap.exists()) {
        throw new Error(`O usuário @${cleanUsername} já está em uso no PapoBR.`);
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('em uso')) throw e;
    }

    try {
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
        coverURL:
          'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1200&q=80',
        bio: 'Novo membro do PapoBR! 🇧🇷',
        city,
        state,
        createdAt: new Date().toISOString(),
        friendsCount: 0,
        postsCount: 0,
        isVerified: false,
      };

      await setDoc(doc(db, 'users', newUser.uid), userProfile);
      await setDoc(doc(db, 'usernames', cleanUsername), {
        username: cleanUsername,
        uid: newUser.uid,
        createdAt: new Date().toISOString(),
      });

      setProfile(userProfile);
      setIsAuthModalOpen(false);
    } catch (fbErr: unknown) {
      const err = fbErr as { code?: string; message?: string };
      if (err.code === 'auth/operation-not-allowed') {
        // If email provider is disabled in Firebase console, allow immediate fallback session
        const demoUid = 'email_' + cleanUsername;
        const fallbackProfile: UserProfile = {
          uid: demoUid,
          displayName: name,
          username: cleanUsername,
          email,
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
          bio: 'Novo membro do PapoBR! 🇧🇷',
          city,
          state,
          createdAt: new Date().toISOString(),
          friendsCount: 0,
          postsCount: 0,
        };
        setUser({ uid: demoUid, displayName: name, email } as unknown as User);
        setProfile(fallbackProfile);
        localStorage.setItem('papobr_demo_session', JSON.stringify(fallbackProfile));
        setIsAuthModalOpen(false);
        return;
      }
      throw new Error(err.message || 'Erro ao realizar cadastro.');
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await fetchOrCreateProfile(userCredential.user);
      }
      setIsAuthModalOpen(false);
    } catch (fbErr: unknown) {
      const err = fbErr as { code?: string; message?: string };
      if (err.code === 'auth/operation-not-allowed') {
        throw new Error(
          'O login com e-mail não está ativado no Firebase Console. Utilize o botão de Acesso Rápido ou cadastre-se.'
        );
      }
      throw new Error('E-mail ou senha incorretos.');
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    localStorage.removeItem('papobr_demo_session');
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updates);
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (error) {
      console.warn('Update fallback:', error);
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
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
        signInAsDemoUser,
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
