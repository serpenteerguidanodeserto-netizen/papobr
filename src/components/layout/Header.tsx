/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Bell,
  MessageSquare,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavigationTab } from '../../types';

interface HeaderProps {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  searchQuery,
  setSearchQuery,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { user, profile, setIsAuthModalOpen, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentTab('search');
    }
  };

  return (
    <header className="sticky top-0 z-40 h-[72px] bg-white border-b border-[#E5EBE7] px-4 md:px-8 flex items-center justify-between shadow-xs">
      {/* Esquerda: Menu mobile toggle & Logotipo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#163D2B] hover:bg-[#EAF5EE] rounded-lg transition-colors"
          aria-label="Abrir menu de navegação"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <button
          onClick={() => {
            setCurrentTab('feed');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 text-left group focus:outline-hidden"
        >
          <img
            src="/assets/aistudio/image_ac2ee06d.png"
            alt="PapoBR - O Brasil se encontra aqui"
            className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
          />
        </button>
      </div>

      {/* Centro: Campo de Pesquisa Geral */}
      <div className="flex-1 max-w-xl mx-4 hidden sm:block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar pessoas, comunidades, publicações..."
            className="w-full bg-[#F4F7F5] border border-[#E5EBE7] rounded-full py-2.5 pl-11 pr-4 text-sm text-[#163D2B] placeholder-[#738078] focus:outline-hidden focus:border-[#167C49] focus:bg-white focus:ring-2 focus:ring-[#167C49]/15 transition-all"
          />
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#738078]"
          />
        </form>
      </div>

      {/* Direita: Ações do Usuário */}
      <div className="flex items-center gap-2 sm:gap-3">
        {user ? (
          <>
            {/* Mensagens rápidas */}
            <button
              onClick={() => setCurrentTab('messages')}
              className={`relative p-2.5 rounded-full text-[#163D2B] hover:bg-[#EAF5EE] transition-colors ${
                currentTab === 'messages' ? 'bg-[#EAF5EE] text-[#167C49]' : ''
              }`}
              title="Mensagens"
            >
              <MessageSquare size={20} />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#167C49] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Notificações */}
            <button
              onClick={() => setCurrentTab('notifications')}
              className={`relative p-2.5 rounded-full text-[#163D2B] hover:bg-[#EAF5EE] transition-colors ${
                currentTab === 'notifications' ? 'bg-[#EAF5EE] text-[#167C49]' : ''
              }`}
              title="Notificações"
            >
              <Bell size={20} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#F3C84B] text-[#163D2B] font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Avatar & Perfil Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-[#EAF5EE] transition-colors focus:outline-hidden"
              >
                <img
                  src={
                    profile?.photoURL ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`
                  }
                  alt={profile?.displayName || 'Avatar'}
                  className="w-9 h-9 rounded-full object-cover border border-[#167C49]/30"
                />
                <span className="hidden lg:block text-sm font-semibold text-[#163D2B] max-w-[130px] truncate">
                  {profile?.displayName || user.displayName || 'Meu Papo'}
                </span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5EBE7] rounded-2xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-[#E5EBE7]">
                    <p className="text-sm font-bold text-[#163D2B] truncate">
                      {profile?.displayName}
                    </p>
                    <p className="text-xs text-[#738078] truncate">
                      @{profile?.username || 'usuario'}
                    </p>
                    {profile?.city && profile?.state && (
                      <p className="text-[11px] text-[#167C49] font-medium mt-0.5">
                        📍 {profile.city}, {profile.state}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentTab('profile');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-[#163D2B] hover:bg-[#EAF5EE] flex items-center gap-2.5 transition-colors"
                  >
                    <UserIcon size={16} className="text-[#167C49]" />
                    Meu Perfil
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTab('settings');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-[#163D2B] hover:bg-[#EAF5EE] flex items-center gap-2.5 transition-colors"
                  >
                    <Settings size={16} className="text-[#167C49]" />
                    Configurações & LGPD
                  </button>

                  <div className="border-t border-[#E5EBE7] my-1" />

                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut size={16} />
                    Sair da Conta
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-[#167C49] hover:bg-[#115D38] text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} className="text-[#F3C84B]" />
              Entrar no PapoBR
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
