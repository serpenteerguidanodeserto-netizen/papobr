/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  increment,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Post, Comment, UserProfile } from '../types';

export const INITIAL_SEED_POSTS: Omit<Post, 'id'>[] = [
  {
    authorId: 'papo_oficial',
    authorName: 'Equipe PapoBR',
    authorUsername: 'papobr',
    authorPhotoURL: '/assets/aistudio/image_ac2ee06d.png',
    content: 'Sejam todos muito bem-vindos ao PapoBR! 🇧🇷✨\n\nAqui o Brasil se encontra para debater ideias, compartilhar momentos autênticos, prestigiar nossa cultura e aproximar pessoas de norte a sul. Conte pra gente nos comentários: de qual estado você está falando hoje?',
    imageUrls: [
      'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80',
    ],
    likesCount: 142,
    commentsCount: 38,
    sharesCount: 19,
    location: 'Brasília, DF',
    tags: ['Brasil', 'Comunidade', 'BoasVindas', 'PapoBR'],
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    authorId: 'ana_carolina_sp',
    authorName: 'Ana Carolina Dias',
    authorUsername: 'anadias_sp',
    authorPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    content: 'Manhã produtiva por aqui em São Paulo! ☕ Nada como um cafezinho coado fresquinho de Minas Gerais antes de abrir o laptop. Quem mais aí não funciona sem a primeira xícara?',
    imageUrls: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80',
    ],
    likesCount: 56,
    commentsCount: 14,
    sharesCount: 3,
    location: 'São Paulo, SP',
    tags: ['Cafezinho', 'TrabalhoRemoto', 'BomDia'],
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    authorId: 'rodrigo_bahia',
    authorName: 'Rodrigo Santana',
    authorUsername: 'rodrigosantana',
    authorPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    content: 'Fim de tarde no Farol da Barra em Salvador. Essa luz só a Bahia tem! Quem tiver passando por aqui essa semana, bora marcar uma água de coco na orla. 🥥🌊☀️',
    imageUrls: [
      'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?auto=format&fit=crop&w=1200&q=80',
    ],
    likesCount: 89,
    commentsCount: 22,
    sharesCount: 7,
    location: 'Salvador, BA',
    tags: ['Salvador', 'Bahia', 'Nordeste', 'TurismoBR'],
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    authorId: 'lucas_tech_rio',
    authorName: 'Lucas Ferreira',
    authorUsername: 'lucastech',
    authorPhotoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    content: 'Muito legal ver uma rede social genuinamente brasileira crescendo! Interface limpa, rápida e com a nossa cara. Parabéns aos desenvolvedores da comunidade. 🚀💻',
    likesCount: 112,
    commentsCount: 18,
    sharesCount: 12,
    location: 'Rio de Janeiro, RJ',
    tags: ['Tecnologia', 'InovaçãoBR', 'DevBrasil'],
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
];

export async function seedInitialPostsIfEmpty() {
  try {
    const postsRef = collection(db, 'posts');
    const snap = await getDocs(query(postsRef, limit(1)));
    if (snap.empty) {
      console.info('PapoBR: Semeando publicações de boas-vindas no Firestore...');
      for (const item of INITIAL_SEED_POSTS) {
        const newDocRef = doc(postsRef);
        await setDoc(newDocRef, { ...item, id: newDocRef.id });
      }
    }
  } catch (err) {
    console.warn('Nota: Semeador inicial:', err);
  }
}

export function subscribeToPosts(
  onUpdate: (posts: Post[]) => void,
  onError?: (err: unknown) => void
) {
  const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));

  return onSnapshot(
    postsQuery,
    (snapshot) => {
      const posts: Post[] = [];
      snapshot.forEach((docSnap) => {
        posts.push({ ...docSnap.data(), id: docSnap.id } as Post);
      });
      onUpdate(posts);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
      if (onError) onError(error);
    }
  );
}

export async function createNewPost(
  author: UserProfile,
  data: {
    content: string;
    imageUrls?: string[];
    location?: string;
    communityId?: string;
    communityName?: string;
    tags?: string[];
  }
): Promise<string> {
  try {
    const postsCol = collection(db, 'posts');
    const newPostRef = doc(postsCol);
    const newPost: Post = {
      id: newPostRef.id,
      authorId: author.uid,
      authorName: author.displayName,
      authorUsername: author.username,
      authorPhotoURL: author.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.username}`,
      content: data.content,
      imageUrls: data.imageUrls || [],
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      communityId: data.communityId,
      communityName: data.communityName,
      location: data.location || (author.city && author.state ? `${author.city}, ${author.state}` : 'Brasil'),
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
    };

    await setDoc(newPostRef, newPost);

    // Increment author post count
    const userRef = doc(db, 'users', author.uid);
    await updateDoc(userRef, { postsCount: increment(1) }).catch(() => {});

    return newPostRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'posts');
    throw error;
  }
}

export async function toggleLikePost(
  postId: string,
  userId: string,
  authorProfile?: UserProfile
): Promise<boolean> {
  try {
    const likeDocRef = doc(db, 'posts', postId, 'likes', userId);
    const postRef = doc(db, 'posts', postId);
    const likeSnap = await getDoc(likeDocRef);

    if (likeSnap.exists()) {
      // Remove like
      await deleteDoc(likeDocRef);
      await updateDoc(postRef, { likesCount: increment(-1) });
      return false;
    } else {
      // Add like
      await setDoc(likeDocRef, {
        userId,
        postId,
        createdAt: new Date().toISOString(),
      });
      await updateDoc(postRef, { likesCount: increment(1) });

      // If user liked someone else's post, add notification
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data() as Post;
        if (postData.authorId !== userId && authorProfile) {
          const notifRef = doc(collection(db, 'notifications'));
          await setDoc(notifRef, {
            id: notifRef.id,
            recipientId: postData.authorId,
            actorId: userId,
            actorName: authorProfile.displayName,
            actorPhotoURL: authorProfile.photoURL,
            type: 'like',
            entityId: postId,
            message: `${authorProfile.displayName} curtiu a sua publicação.`,
            isRead: false,
            createdAt: new Date().toISOString(),
          }).catch(() => {});
        }
      }
      return true;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}/likes`);
    throw error;
  }
}

export function subscribeToPostLikes(
  postId: string,
  userId: string,
  onLikedChange: (isLiked: boolean) => void
) {
  if (!userId) {
    onLikedChange(false);
    return () => {};
  }
  const likeDocRef = doc(db, 'posts', postId, 'likes', userId);
  return onSnapshot(likeDocRef, (snap) => {
    onLikedChange(snap.exists());
  });
}

export function subscribeToComments(
  postId: string,
  onUpdate: (comments: Comment[]) => void
) {
  const commentsQuery = query(
    collection(db, 'posts', postId, 'comments'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    commentsQuery,
    (snapshot) => {
      const comments: Comment[] = [];
      snapshot.forEach((docSnap) => {
        comments.push({ ...docSnap.data(), id: docSnap.id } as Comment);
      });
      onUpdate(comments);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `posts/${postId}/comments`);
    }
  );
}

export async function addCommentToPost(
  postId: string,
  author: UserProfile,
  content: string
): Promise<void> {
  try {
    const commentsCol = collection(db, 'posts', postId, 'comments');
    const newCommentRef = doc(commentsCol);
    const postRef = doc(db, 'posts', postId);

    const commentData: Comment = {
      id: newCommentRef.id,
      postId,
      authorId: author.uid,
      authorName: author.displayName,
      authorUsername: author.username,
      authorPhotoURL: author.photoURL,
      content,
      createdAt: new Date().toISOString(),
    };

    await setDoc(newCommentRef, commentData);
    await updateDoc(postRef, { commentsCount: increment(1) });

    // Send notification to post author
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const postData = postSnap.data() as Post;
      if (postData.authorId !== author.uid) {
        const notifRef = doc(collection(db, 'notifications'));
        await setDoc(notifRef, {
          id: notifRef.id,
          recipientId: postData.authorId,
          actorId: author.uid,
          actorName: author.displayName,
          actorPhotoURL: author.photoURL,
          type: 'comment',
          entityId: postId,
          message: `${author.displayName} comentou na sua publicação: "${content.slice(0, 40)}${content.length > 40 ? '...' : ''}"`,
          isRead: false,
          createdAt: new Date().toISOString(),
        }).catch(() => {});
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `posts/${postId}/comments`);
    throw error;
  }
}

export async function deletePostById(postId: string): Promise<void> {
  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
    throw error;
  }
}

export async function deleteCommentFromPost(postId: string, commentId: string): Promise<void> {
  try {
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    await deleteDoc(commentRef);
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { commentsCount: increment(-1) }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `posts/${postId}/comments/${commentId}`);
    throw error;
  }
}
