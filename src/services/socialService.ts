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
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  FriendRequest,
  Community,
  MarketplaceItem,
  VideoItem,
  NotificationItem,
  Conversation,
  Message,
  UserProfile,
} from '../types';

/* ----------------------------------------------------
   AMIZADES & CONEXÕES
---------------------------------------------------- */

export function subscribeToFriendRequests(
  userId: string,
  onUpdate: (requests: FriendRequest[]) => void
) {
  if (!userId) return () => {};
  const q = query(
    collection(db, 'friendRequests'),
    where('receiverId', '==', userId),
    where('status', '==', 'pending')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const requests: FriendRequest[] = [];
      snapshot.forEach((snap) => {
        requests.push({ ...snap.data(), id: snap.id } as FriendRequest);
      });
      onUpdate(requests);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'friendRequests');
    }
  );
}

export async function sendFriendRequest(sender: UserProfile, targetUser: UserProfile) {
  try {
    const requestId = `${sender.uid}_${targetUser.uid}`;
    const reqRef = doc(db, 'friendRequests', requestId);
    const snap = await getDoc(reqRef);
    if (snap.exists() && snap.data().status === 'pending') {
      return; // Already pending
    }

    const data: FriendRequest = {
      id: requestId,
      senderId: sender.uid,
      senderName: sender.displayName,
      senderUsername: sender.username,
      senderPhotoURL: sender.photoURL,
      receiverId: targetUser.uid,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await setDoc(reqRef, data);

    // Notification
    const notifRef = doc(collection(db, 'notifications'));
    await setDoc(notifRef, {
      id: notifRef.id,
      recipientId: targetUser.uid,
      actorId: sender.uid,
      actorName: sender.displayName,
      actorPhotoURL: sender.photoURL,
      type: 'friend_request',
      entityId: requestId,
      message: `${sender.displayName} enviou um pedido de amizade para você!`,
      isRead: false,
      createdAt: new Date().toISOString(),
    }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'friendRequests');
    throw error;
  }
}

export async function respondToFriendRequest(
  requestId: string,
  status: 'accepted' | 'rejected',
  responder: UserProfile
) {
  try {
    const reqRef = doc(db, 'friendRequests', requestId);
    const snap = await getDoc(reqRef);
    if (!snap.exists()) return;
    const reqData = snap.data() as FriendRequest;

    if (status === 'accepted') {
      await updateDoc(reqRef, { status: 'accepted' });
      // Notification to sender
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        id: notifRef.id,
        recipientId: reqData.senderId,
        actorId: responder.uid,
        actorName: responder.displayName,
        actorPhotoURL: responder.photoURL,
        type: 'friend_accept',
        entityId: requestId,
        message: `${responder.displayName} aceitou seu pedido de amizade! 🎉`,
        isRead: false,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    } else {
      await updateDoc(reqRef, { status: 'rejected' });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `friendRequests/${requestId}`);
    throw error;
  }
}

export async function cancelFriendRequest(requestId: string) {
  try {
    const reqRef = doc(db, 'friendRequests', requestId);
    await deleteDoc(reqRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `friendRequests/${requestId}`);
    throw error;
  }
}

export async function removeFriendship(requestId: string) {
  try {
    const reqRef = doc(db, 'friendRequests', requestId);
    await deleteDoc(reqRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `friendRequests/${requestId}`);
    throw error;
  }
}


/* ----------------------------------------------------
   COMUNIDADES BRASILEIRAS
---------------------------------------------------- */

export const INITIAL_COMMUNITIES: Community[] = [
  {
    id: 'culinaria-brasileira',
    name: 'Culinária Brasileira 🇧🇷🍲',
    slug: 'culinaria-brasileira',
    description: 'Receitas típicas, dicas de tempero, feijoada, moqueca, acarajé, pão de queijo e os segredos da nossa mesa.',
    category: 'Gastronomia',
    imageURL: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
    coverURL: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    creatorId: 'system',
    creatorName: 'PapoBR',
    membersCount: 1420,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'futebol-resenha',
    name: 'Futebol & Resenha ⚽🍻',
    slug: 'futebol-resenha',
    description: 'Brasileirão, Seleção, Copa do Brasil, lances históricos e debate apaixonado sem clubismo tóxico.',
    category: 'Esportes',
    imageURL: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
    coverURL: 'https://images.unsplash.com/photo-1489944445301-ff536f500057?auto=format&fit=crop&w=1200&q=80',
    creatorId: 'system',
    creatorName: 'PapoBR',
    membersCount: 2310,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tecnologia-startups-br',
    name: 'Tech & Inovação Brasil 💡💻',
    slug: 'tecnologia-startups-br',
    description: 'Desenvolvimento, IA, ecossistema de startups, carreira remota e novidades da tecnologia tupiniquim.',
    category: 'Tecnologia',
    imageURL: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    coverURL: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    creatorId: 'system',
    creatorName: 'PapoBR',
    membersCount: 980,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'musica-popular-brasileira',
    name: 'Música & Ritmos do Brasil 🎶',
    slug: 'musica-popular-brasileira',
    description: 'Do samba ao forró, da MPB ao rock nacional, funk e sertanejo. Compartilhe suas canções e lançamentos.',
    category: 'Cultura',
    imageURL: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    coverURL: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    creatorId: 'system',
    creatorName: 'PapoBR',
    membersCount: 1650,
    createdAt: new Date().toISOString(),
  },
];

export async function seedCommunitiesIfEmpty() {
  try {
    const colRef = collection(db, 'communities');
    const snap = await getDocs(query(colRef, limit(1)));
    if (snap.empty) {
      for (const comm of INITIAL_COMMUNITIES) {
        await setDoc(doc(colRef, comm.id), comm);
      }
    }
  } catch (err) {
    console.warn('Seed communities:', err);
  }
}

export function subscribeToCommunities(onUpdate: (communities: Community[]) => void) {
  const colRef = collection(db, 'communities');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Community[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as Community);
      });
      onUpdate(list.length > 0 ? list : INITIAL_COMMUNITIES);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'communities');
    }
  );
}

export async function createCommunity(
  creator: UserProfile,
  data: {
    name: string;
    description: string;
    category: string;
    imageURL?: string;
    coverURL?: string;
  }
) {
  try {
    const newDocRef = doc(collection(db, 'communities'));
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCommunity: Community = {
      id: newDocRef.id,
      name: data.name,
      slug,
      description: data.description,
      category: data.category,
      imageURL: data.imageURL || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
      coverURL: data.coverURL || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
      creatorId: creator.uid,
      creatorName: creator.displayName,
      membersCount: 1,
      createdAt: new Date().toISOString(),
    };
    await setDoc(newDocRef, newCommunity);
    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'communities');
    throw error;
  }
}

/* ----------------------------------------------------
   MERCADO PAPOBR (MARKETPLACE)
---------------------------------------------------- */

export const INITIAL_MARKETPLACE: MarketplaceItem[] = [
  {
    id: 'item-1',
    sellerId: 'system',
    sellerName: 'Marcos Vinicius',
    sellerPhotoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    title: 'Violão Takamine GD10 Elétrico Aço',
    description: 'Violão em estado de novo, com cordas Elixir recém colocadas. Acompanha capa acolchoada e correia de couro. Retirada em mãos em Pinheiros.',
    price: 1850,
    category: 'Instrumentos Musicais',
    city: 'São Paulo',
    state: 'SP',
    imageUrls: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80'],
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'item-2',
    sellerId: 'system',
    sellerName: 'Fernanda Lima',
    sellerPhotoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    title: 'Bicicleta Caloi Aro 29 Alumínio 21V',
    description: 'Ótima para ciclovias e passeios na orla. Freios a disco, revisada na semana passada. Motivo da venda: mudança de estado.',
    price: 980,
    category: 'Esportes & Lazer',
    city: 'Curitiba',
    state: 'PR',
    imageUrls: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80'],
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: 'item-3',
    sellerId: 'system',
    sellerName: 'Gabriel Costa',
    sellerPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    title: 'MacBook Air M1 256GB Cinza Espacial',
    description: 'Bateria com 91% de saúde. Sem marcas de queda ou arranhões. Acompanha carregador original e caixa.',
    price: 4300,
    category: 'Eletrônicos & Celulares',
    city: 'Belo Horizonte',
    state: 'MG',
    imageUrls: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'],
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
  },
];

export function subscribeToMarketplace(onUpdate: (items: MarketplaceItem[]) => void) {
  const colRef = collection(db, 'marketplace');
  return onSnapshot(
    query(colRef, orderBy('createdAt', 'desc'), limit(50)),
    (snapshot) => {
      const items: MarketplaceItem[] = [];
      snapshot.forEach((snap) => {
        items.push({ ...snap.data(), id: snap.id } as MarketplaceItem);
      });
      onUpdate(items.length > 0 ? items : INITIAL_MARKETPLACE);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'marketplace');
    }
  );
}

export async function createMarketplaceItem(
  seller: UserProfile,
  data: {
    title: string;
    description: string;
    price: number;
    category: string;
    city: string;
    state: string;
    imageUrls: string[];
  }
) {
  try {
    const docRef = doc(collection(db, 'marketplace'));
    const item: MarketplaceItem = {
      id: docRef.id,
      sellerId: seller.uid,
      sellerName: seller.displayName,
      sellerUsername: seller.username,
      sellerPhotoURL: seller.photoURL,
      title: data.title,
      description: data.description,
      price: data.price,
      category: data.category,
      city: data.city,
      state: data.state,
      imageUrls: data.imageUrls,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, item);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'marketplace');
    throw error;
  }
}

export async function updateMarketplaceItem(
  itemId: string,
  data: Partial<MarketplaceItem>
) {
  try {
    const docRef = doc(db, 'marketplace', itemId);
    await updateDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `marketplace/${itemId}`);
    throw error;
  }
}

export async function deleteMarketplaceItem(itemId: string) {
  try {
    const docRef = doc(db, 'marketplace', itemId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `marketplace/${itemId}`);
    throw error;
  }
}


/* ----------------------------------------------------
   PAPO VÍDEOS (VÍDEOS CURTOS)
---------------------------------------------------- */

export const INITIAL_VIDEOS: VideoItem[] = [
  {
    id: 'vid-1',
    authorId: 'system',
    authorName: 'Turismo Brasil',
    authorUsername: 'turismobr',
    authorPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    title: 'Cataratas do Iguaçu em um dia ensolarado 🌈🌊',
    description: 'A força da natureza no Paraná. Uma das 7 maravilhas da natureza!',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4',
    likesCount: 342,
    commentsCount: 45,
    tags: ['Paraná', 'Cataratas', 'BrasilNatureza'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vid-2',
    authorId: 'system',
    authorName: 'Chef Mateus',
    authorUsername: 'mateuschef',
    authorPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    title: 'O segredo do pão de queijo crocante por fora e macio por dentro! 🧀',
    description: 'Polvilho azedo + queijo canastra meia cura. O resultado é inacreditável!',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cooking-a-delicious-meal-in-a-pan-43407-large.mp4',
    likesCount: 521,
    commentsCount: 88,
    tags: ['MinasGerais', 'Receitas', 'PaoDeQueijo'],
    createdAt: new Date().toISOString(),
  },
];

export function subscribeToVideos(onUpdate: (videos: VideoItem[]) => void) {
  const colRef = collection(db, 'videos');
  return onSnapshot(
    query(colRef, orderBy('createdAt', 'desc'), limit(30)),
    (snapshot) => {
      const items: VideoItem[] = [];
      snapshot.forEach((snap) => {
        items.push({ ...snap.data(), id: snap.id } as VideoItem);
      });
      try {
        const local = JSON.parse(localStorage.getItem('papobr_local_videos') || '[]') as VideoItem[];
        const combined = [...local, ...items, ...INITIAL_VIDEOS];
        const unique = Array.from(new Map(combined.map((v) => [v.id, v])).values());
        onUpdate(unique);
      } catch {
        onUpdate(items.length > 0 ? items : INITIAL_VIDEOS);
      }
    },
    (err) => {
      console.warn('Subscription error for videos, using local store:', err);
      try {
        const local = JSON.parse(localStorage.getItem('papobr_local_videos') || '[]') as VideoItem[];
        const combined = [...local, ...INITIAL_VIDEOS];
        const unique = Array.from(new Map(combined.map((v) => [v.id, v])).values());
        onUpdate(unique);
      } catch {
        onUpdate(INITIAL_VIDEOS);
      }
    }
  );
}

export async function createVideoPost(
  author: UserProfile,
  data: {
    title: string;
    description: string;
    videoUrl: string;
    tags?: string[];
  }
) {
  const docRef = doc(collection(db, 'videos'));
  const item: VideoItem = {
    id: docRef.id,
    authorId: author.uid,
    authorName: author.displayName,
    authorUsername: author.username,
    authorPhotoURL: author.photoURL,
    title: data.title,
    description: data.description,
    videoUrl: data.videoUrl,
    likesCount: 0,
    commentsCount: 0,
    tags: data.tags || [],
    createdAt: new Date().toISOString(),
  };

  try {
    const local = JSON.parse(localStorage.getItem('papobr_local_videos') || '[]') as VideoItem[];
    localStorage.setItem('papobr_local_videos', JSON.stringify([item, ...local]));
  } catch (e) {
    console.warn('Falha ao salvar vídeo no localStorage:', e);
  }

  try {
    await setDoc(docRef, item);
    return docRef.id;
  } catch (error) {
    console.warn('Aviso: Firestore recusou gravação direta de vídeo, mantido no armazenamento local:', error);
    return docRef.id;
  }
}

export async function submitReport(
  reporterId: string,
  targetType: 'post' | 'video' | 'user' | 'comment',
  targetId: string,
  reason: string
) {
  try {
    const reportRef = doc(collection(db, 'reports'));
    await setDoc(reportRef, {
      id: reportRef.id,
      reporterId,
      targetType,
      targetId,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Report submission:', error);
  }
}


/* ----------------------------------------------------
   NOTIFICAÇÕES
---------------------------------------------------- */

export function subscribeToNotifications(
  userId: string,
  onUpdate: (items: NotificationItem[]) => void
) {
  if (!userId) return () => {};
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(40)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: NotificationItem[] = [];
      snapshot.forEach((snap) => {
        items.push({ ...snap.data(), id: snap.id } as NotificationItem);
      });
      onUpdate(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'notifications');
    }
  );
}

export async function markNotificationAsRead(notifId: string) {
  try {
    const notifRef = doc(db, 'notifications', notifId);
    await updateDoc(notifRef, { isRead: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notifId}`);
  }
}

/* ----------------------------------------------------
   MENSAGENS PRIVADAS (CHAT EM TEMPO REAL)
---------------------------------------------------- */

export function subscribeToUserConversations(
  userId: string,
  onUpdate: (convs: Conversation[]) => void
) {
  if (!userId) return () => {};
  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', userId),
    orderBy('updatedAt', 'desc'),
    limit(30)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Conversation[] = [];
      snapshot.forEach((snap) => {
        list.push({ ...snap.data(), id: snap.id } as Conversation);
      });
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'conversations');
    }
  );
}

export function subscribeToMessages(
  conversationId: string,
  onUpdate: (messages: Message[]) => void
) {
  if (!conversationId) return () => {};
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(100)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Message[] = [];
      snapshot.forEach((snap) => {
        list.push({ ...snap.data(), id: snap.id } as Message);
      });
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `conversations/${conversationId}/messages`);
    }
  );
}

export async function sendDirectMessage(
  conversationId: string,
  sender: UserProfile,
  recipient: { uid: string; displayName: string; username: string; photoURL?: string },
  text: string
) {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    const msgRef = doc(collection(db, 'conversations', conversationId, 'messages'));
    const now = new Date().toISOString();

    const newMsg: Message = {
      id: msgRef.id,
      conversationId,
      senderId: sender.uid,
      text,
      isRead: false,
      createdAt: now,
    };

    await setDoc(msgRef, newMsg);

    await setDoc(
      convRef,
      {
        id: conversationId,
        participantIds: [sender.uid, recipient.uid],
        participants: {
          [sender.uid]: {
            displayName: sender.displayName,
            username: sender.username,
            photoURL: sender.photoURL || '',
          },
          [recipient.uid]: {
            displayName: recipient.displayName,
            username: recipient.username,
            photoURL: recipient.photoURL || '',
          },
        },
        lastMessageText: text,
        lastMessageSenderId: sender.uid,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `conversations/${conversationId}/messages`);
    throw error;
  }
}

export async function markConversationMessagesAsRead(
  conversationId: string,
  currentUserId: string
) {
  try {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      where('isRead', '==', false)
    );
    const snap = await getDocs(q);
    const now = new Date().toISOString();
    for (const docSnap of snap.docs) {
      const data = docSnap.data() as Message;
      if (data.senderId !== currentUserId) {
        await updateDoc(docSnap.ref, { isRead: true, readAt: now }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Read receipt update:', err);
  }
}

