/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Home,
  Search,
  MessageSquare,
  PlaySquare,
  ShoppingBag,
  Bell,
  Compass,
  Users,
  User,
  Settings,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { NavigationTab } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
  pendingFriendRequestsCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  setCurrentTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
}) => {
  const { user, profile, setIsAuthModalOpen, logout } = useAuth();

  const primaryMobileTabs: { id: NavigationTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; badge?: number }[] = [
    { id: 'feed', label: 'Início', icon: Home },
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'videos', label: 'Vídeos', icon: PlaySquare },
    { id: 'messages', label: 'Papo', icon: MessageSquare, badge: unreadMessagesCount },
    { id: 'notifications', label: 'Avisos', icon: Bell, badge: unreadNotificationsCount },
  ];

  const allDrawerItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'feed', label: 'Início (Feed Principal)', icon: Home },
    { id: 'search', label: 'Pesquisar & Explorar', icon: Search },
    { id: 'friends', label: 'Amigos & Solicitações', icon: Users },
    { id: 'messages', label: 'Mensagens Diretas', icon: MessageSquare },
    { id: 'videos', label: 'Papo Vídeos', icon: PlaySquare },
    { id: 'marketplace', label: 'Mercado PapoBR', icon: ShoppingBag },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'communities', label: 'Comunidades do Brasil', icon: Compass },
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'settings', label: 'Configurações & LGPD', icon: Settings },
  ];

  const handleSelectTab = (tab: NavigationTab) => {
    if (!user && (tab === 'messages' || tab === 'notifications' || tab === 'profile' || tab === 'friends')) {
      setIsAuthModalOpen(true);
      setMobileMenuOpen(false);
      return;
    }
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Barra Inferior Fixa Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5EBE7] px-2 py-2 flex items-center justify-around z-40 shadow-lg">
        {primaryMobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors cursor-pointer ${
                isActive ? 'text-[#167C49]' : 'text-[#738078]'
              }`}
            >
              <Icon size={22} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-[#F3C84B] rounded-full ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Drawer Lateral Mobile Completo */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop escuro */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-5 z-10 overflow-y-auto">
            <div>
              {/* Header do Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E5EBE7]">
                <img
                  src="/assets/aistudio/image_ac2ee06d.png"
                  alt="PapoBR"
                  className="h-9 w-auto"
                />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-[#738078] hover:bg-[#F4F7F5] rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Card de Usuário */}
              {user ? (
                <div
                  onClick={() => handleSelectTab('profile')}
                  className="flex items-center gap-3 p-3 my-4 rounded-2xl bg-[#EAF5EE] border border-[#167C49]/20"
                >
                  <img
                    src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                    alt="Perfil"
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#167C49]"
                  />
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-[#163D2B] truncate">{profile?.displayName}</p>
                    <p className="text-xs text-[#167C49]">@{profile?.username}</p>
                  </div>
                </div>
              ) : (
                <div className="my-4 p-4 rounded-2xl bg-[#EAF5EE] border border-[#167C49]/20 text-center">
                  <p className="text-sm font-bold text-[#163D2B] mb-2">Bem-vindo ao PapoBR!</p>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full py-2 bg-[#167C49] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={14} className="text-[#F3C84B]" />
                    Criar conta ou Entrar
                  </button>
                </div>
              )}

              {/* Lista completa de abas */}
              <div className="space-y-1">
                {allDrawerItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#EAF5EE] text-[#167C49] font-bold'
                          : 'text-[#163D2B] hover:bg-[#F4F7F5]'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-[#167C49]' : 'text-[#738078]'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout se autenticado */}
            {user && (
              <div className="pt-4 border-t border-[#E5EBE7]">
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 text-sm text-red-600 font-semibold p-2 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut size={18} />
                  Sair do PapoBR
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
