/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Home,
  Search,
  Users,
  MessageSquare,
  PlaySquare,
  ShoppingBag,
  Bell,
  Compass,
  User,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { NavigationTab } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
  pendingFriendRequestsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
  pendingFriendRequestsCount = 0,
}) => {
  const { user, profile, setIsAuthModalOpen } = useAuth();

  const menuItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: number;
  }[] = [
    { id: 'feed', label: 'Início', icon: Home },
    { id: 'search', label: 'Pesquisar', icon: Search },
    { id: 'friends', label: 'Amigos', icon: Users, badge: pendingFriendRequestsCount },
    { id: 'messages', label: 'Mensagens', icon: MessageSquare, badge: unreadMessagesCount },
    { id: 'videos', label: 'Papo Vídeos', icon: PlaySquare },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'notifications', label: 'Notificações', icon: Bell, badge: unreadNotificationsCount },
    { id: 'communities', label: 'Comunidades', icon: Compass },
    { id: 'profile', label: 'Meu perfil', icon: User },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleTabClick = (tabId: NavigationTab) => {
    // If guest clicks private tabs, prompt auth
    if (!user && (tabId === 'messages' || tabId === 'notifications' || tabId === 'profile' || tabId === 'friends')) {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <aside className="w-64 bg-white border-r border-[#E5EBE7] min-h-[calc(100vh-72px)] p-4 flex flex-col justify-between shrink-0">
      <div>
        {/* Cartão de Usuário no topo do Menu */}
        {user ? (
          <div
            onClick={() => setCurrentTab('profile')}
            className="flex items-center gap-3 p-3 mb-4 rounded-2xl bg-[#F4F7F5] hover:bg-[#EAF5EE] transition-all cursor-pointer border border-[#E5EBE7]"
          >
            <img
              src={
                profile?.photoURL ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`
              }
              alt={profile?.displayName || 'Avatar'}
              className="w-11 h-11 rounded-full object-cover border-2 border-[#167C49]"
            />
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-[#163D2B] truncate font-heading">
                {profile?.displayName || 'Brasileiro Papo'}
              </h4>
              <p className="text-xs text-[#738078] truncate">
                @{profile?.username || 'usuario'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 mb-4 rounded-2xl bg-[#EAF5EE] border border-[#167C49]/20">
            <p className="text-xs font-semibold text-[#163D2B] mb-2 font-heading">
              Faça parte da nossa rede
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full text-xs font-bold bg-[#167C49] hover:bg-[#115D38] text-white py-2 rounded-xl transition-colors cursor-pointer"
            >
              Criar conta grátis
            </button>
          </div>
        )}

        {/* Lista de Navegação Principal */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isTabActive =
              currentTab === item.id ||
              (item.id === ('notificacoes' as NavigationTab) && currentTab === 'notifications');

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isTabActive
                    ? 'bg-[#EAF5EE] text-[#167C49] font-bold'
                    : 'text-[#163D2B] hover:bg-[#F4F7F5] hover:text-[#167C49]'
                }`}
              >
                {/* Indicador lateral verde quando selecionado */}
                {isTabActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#167C49] rounded-r-full" />
                )}

                <div className="flex items-center gap-3">
                  <Icon
                    size={20}
                    className={`transition-transform group-hover:scale-110 ${
                      isTabActive ? 'text-[#167C49]' : 'text-[#738078]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isTabActive
                        ? 'bg-[#167C49] text-white'
                        : 'bg-[#F3C84B] text-[#163D2B]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Rodapé do Menu com compromisso brasileiro */}
      <div className="pt-4 border-t border-[#E5EBE7] text-[11px] text-[#738078] space-y-2">
        <div className="flex items-center gap-1.5 text-[#167C49] font-semibold">
          <ShieldCheck size={14} />
          <span>Privacidade & LGPD Brasil</span>
        </div>
        <p className="leading-relaxed">
          PapoBR © 2026. Conectando brasileiros com respeito, transparência e tecnologia.
        </p>
      </div>
    </aside>
  );
};
