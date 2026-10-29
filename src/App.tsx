/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { RightSidebar } from './components/layout/RightSidebar';
import { MobileNav } from './components/layout/MobileNav';
import { AuthModal } from './components/auth/AuthModal';

import { FeedView } from './components/feed/FeedView';
import { ProfileView } from './components/profile/ProfileView';
import { FriendsView } from './components/friends/FriendsView';
import { MessagesView } from './components/messages/MessagesView';
import { MarketplaceView } from './components/marketplace/MarketplaceView';
import { VideosView } from './components/videos/VideosView';
import { CommunitiesView } from './components/communities/CommunitiesView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { SearchView } from './components/search/SearchView';
import { SettingsView } from './components/settings/SettingsView';

import { NavigationTab } from './types';
import { testFirestoreConnection } from './lib/firebase';
import {
  subscribeToNotifications,
  subscribeToFriendRequests,
  subscribeToUserConversations,
} from './services/socialService';

function MainLayout() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [targetProfileId, setTargetProfileId] = useState<string | undefined>(undefined);
  const [chatRecipient, setChatRecipient] = useState<{
    uid: string;
    displayName: string;
    username: string;
    photoURL?: string;
  } | null>(null);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingFriendsCount, setPendingFriendsCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Listeners for badge counts
  useEffect(() => {
    if (!user) {
      setUnreadNotifications(0);
      setPendingFriendsCount(0);
      setUnreadMessages(0);
      return;
    }

    const unsubNotifs = subscribeToNotifications(user.uid, (list) => {
      setUnreadNotifications(list.filter((n) => !n.isRead).length);
    });

    const unsubFriends = subscribeToFriendRequests(user.uid, (list) => {
      setPendingFriendsCount(list.length);
    });

    const unsubConvs = subscribeToUserConversations(user.uid, (list) => {
      setUnreadMessages(list.length > 0 ? 1 : 0);
    });

    return () => {
      unsubNotifs();
      unsubFriends();
      unsubConvs();
    };
  }, [user]);

  const handleAuthorClick = (authorId: string) => {
    setTargetProfileId(authorId);
    setCurrentTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartChat = (recipient: {
    uid: string;
    displayName: string;
    username: string;
    photoURL?: string;
  }) => {
    setChatRecipient(recipient);
    setCurrentTab('messages');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        unreadNotificationsCount={unreadNotifications}
        unreadMessagesCount={unreadMessages}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Container 3-Column */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex items-start justify-center">
        {/* Menu Lateral Esquerdo (Desktop) */}
        <div className="hidden md:block sticky top-[72px] self-start">
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={(tab) => {
              if (tab === 'profile') setTargetProfileId(undefined);
              setCurrentTab(tab);
            }}
            unreadNotificationsCount={unreadNotifications}
            unreadMessagesCount={unreadMessages}
            pendingFriendRequestsCount={pendingFriendsCount}
          />
        </div>

        {/* Área Central de Conteúdo */}
        <main className="flex-1 min-w-0 px-3 sm:px-6 py-6 pb-20 md:pb-8">
          {currentTab === 'feed' && (
            <FeedView onAuthorClick={handleAuthorClick} />
          )}

          {currentTab === 'profile' && (
            <ProfileView
              targetUserId={targetProfileId}
              onBackToFeed={() => setCurrentTab('feed')}
            />
          )}

          {currentTab === 'friends' && (
            <FriendsView onStartChat={handleStartChat} />
          )}

          {currentTab === 'messages' && (
            <MessagesView initialChatUser={chatRecipient} />
          )}

          {currentTab === 'marketplace' && (
            <MarketplaceView onContactSeller={handleStartChat} />
          )}

          {currentTab === 'videos' && (
            <VideosView />
          )}

          {currentTab === 'communities' && (
            <CommunitiesView />
          )}

          {currentTab === 'notifications' && (
            <NotificationsView />
          )}

          {currentTab === 'search' && (
            <SearchView
              initialQuery={searchQuery}
              onAuthorClick={handleAuthorClick}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView />
          )}
        </main>

        {/* Painel Lateral Direito (Desktop) */}
        {currentTab !== 'messages' && currentTab !== 'videos' && (
          <div className="hidden xl:block sticky top-[72px] self-start">
            <RightSidebar
              setCurrentTab={setCurrentTab}
              setSearchQuery={setSearchQuery}
            />
          </div>
        )}
      </div>

      {/* Navegação Mobile Inferior e Drawer */}
      <MobileNav
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'profile') setTargetProfileId(undefined);
          setCurrentTab(tab);
        }}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        unreadNotificationsCount={unreadNotifications}
        unreadMessagesCount={unreadMessages}
        pendingFriendRequestsCount={pendingFriendsCount}
      />

      {/* Modal de Autenticação */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
