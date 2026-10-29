/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  email: string;
  photoURL?: string;
  coverURL?: string;
  bio?: string;
  city?: string;
  state?: string;
  createdAt: string;
  friendsCount?: number;
  postsCount?: number;
  isVerified?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorPhotoURL?: string;
  content: string;
  imageUrls?: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount?: number;
  communityId?: string;
  communityName?: string;
  location?: string;
  tags?: string[];
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderPhotoURL?: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants: {
    [uid: string]: {
      displayName: string;
      username: string;
      photoURL?: string;
    };
  };
  lastMessageText: string;
  lastMessageSenderId: string;
  updatedAt: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  isRead?: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  actorPhotoURL?: string;
  type: 'like' | 'comment' | 'friend_request' | 'friend_accept' | 'community' | 'welcome';
  entityId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageURL?: string;
  coverURL?: string;
  category: string;
  creatorId: string;
  creatorName?: string;
  membersCount: number;
  isJoined?: boolean;
  createdAt: string;
}

export interface MarketplaceItem {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerUsername?: string;
  sellerPhotoURL?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  city: string;
  state: string;
  imageUrls?: string[];
  status: 'active' | 'sold';
  createdAt: string;
}

export interface VideoItem {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorPhotoURL?: string;
  title: string;
  description: string;
  videoUrl: string;
  likesCount: number;
  commentsCount: number;
  tags?: string[];
  createdAt: string;
}

export type NavigationTab = 
  | 'feed'
  | 'search'
  | 'friends'
  | 'messages'
  | 'videos'
  | 'marketplace'
  | 'notifications'
  | 'communities'
  | 'profile'
  | 'settings';
