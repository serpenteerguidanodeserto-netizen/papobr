/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  Compass,
  UserPlus,
  ShieldAlert,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavigationTab } from '../../types';

interface RightSidebarProps {
  setCurrentTab: (tab: NavigationTab) => void;
  setSearchQuery: (query: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  setCurrentTab,
  setSearchQuery,
}) => {
  const { user, setIsAuthModalOpen } = useAuth();

  const trendingTopics = [
    { tag: 'FutebolBrasileiro', category: 'Esportes', posts: '48,2 mil' },
    { tag: 'CulinariaMineira', category: 'Gastronomia', posts: '19,5 mil' },
    { tag: 'StartupBrasil', category: 'Tecnologia & Negócios', posts: '12,8 mil' },
    { tag: 'MusicaPopular', category: 'Cultura', posts: '31,4 mil' },
    { tag: 'TurismoNordeste', category: 'Viagens', posts: '8,6 mil' },
  ];

  const suggestedCommunities = [
    {
      name: 'Culinária Brasileira 🇧🇷🍲',
      members: '1,4 mil membros',
      img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=150&q=80',
    },
    {
      name: 'Futebol & Resenha ⚽🍻',
      members: '2,3 mil membros',
      img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80',
    },
    {
      name: 'Tech & Inovação Brasil 💡',
      members: '980 membros',
      img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80',
    },
  ];

  const suggestedFriends = [
    {
      name: 'Camila Rocha',
      user: 'camilasurf',
      city: 'Florianópolis, SC',
      img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    },
    {
      name: 'Felipe Duarte',
      user: 'feliped_mg',
      city: 'Belo Horizonte, MG',
      img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    },
  ];

  return (
    <aside className="w-80 p-4 space-y-5 hidden xl:block shrink-0">
      {/* 1. Assuntos em Destaque no Brasil */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5EBE7] shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5EBE7]">
          <div className="flex items-center gap-2 text-[#163D2B] font-bold font-heading text-sm">
            <TrendingUp size={18} className="text-[#167C49]" />
            <span>Assuntos do Momento</span>
          </div>
          <Flame size={16} className="text-[#F3C84B]" />
        </div>

        <div className="space-y-3">
          {trendingTopics.map((topic) => (
            <div
              key={topic.tag}
              onClick={() => {
                setSearchQuery(topic.tag);
                setCurrentTab('search');
              }}
              className="group cursor-pointer hover:bg-[#F4F7F5] -mx-2 px-2 py-1.5 rounded-xl transition-colors"
            >
              <span className="text-[11px] text-[#738078] block">
                {topic.category} • Assunto no Brasil
              </span>
              <p className="text-sm font-bold text-[#163D2B] group-hover:text-[#167C49] transition-colors">
                #{topic.tag}
              </p>
              <span className="text-[11px] text-[#738078]">{topic.posts} publicações</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Comunidades Recomendadas */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5EBE7] shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5EBE7]">
          <div className="flex items-center gap-2 text-[#163D2B] font-bold font-heading text-sm">
            <Compass size={18} className="text-[#167C49]" />
            <span>Comunidades em Alta</span>
          </div>
          <button
            onClick={() => setCurrentTab('communities')}
            className="text-xs font-semibold text-[#167C49] hover:underline cursor-pointer"
          >
            Ver todas
          </button>
        </div>

        <div className="space-y-3">
          {suggestedCommunities.map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between gap-2 hover:bg-[#F4F7F5] p-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={c.img}
                  alt={c.name}
                  className="w-10 h-10 rounded-xl object-cover shrink-0"
                />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-[#163D2B] truncate">
                    {c.name}
                  </p>
                  <p className="text-[11px] text-[#738078] truncate">{c.members}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!user) setIsAuthModalOpen(true);
                  else setCurrentTab('communities');
                }}
                className="text-xs font-semibold px-3 py-1 bg-[#EAF5EE] text-[#167C49] hover:bg-[#167C49] hover:text-white rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                Entrar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Sugestões de Amizade */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5EBE7] shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5EBE7]">
          <div className="flex items-center gap-2 text-[#163D2B] font-bold font-heading text-sm">
            <UserPlus size={18} className="text-[#167C49]" />
            <span>Quem seguir</span>
          </div>
          <button
            onClick={() => setCurrentTab('friends')}
            className="text-xs font-semibold text-[#167C49] hover:underline cursor-pointer"
          >
            Explorar
          </button>
        </div>

        <div className="space-y-3">
          {suggestedFriends.map((f) => (
            <div
              key={f.user}
              className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-[#F4F7F5] transition-colors"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={f.img}
                  alt={f.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#167C49]/20"
                />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-[#163D2B] truncate">{f.name}</p>
                  <p className="text-[11px] text-[#738078] truncate">📍 {f.city}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!user) setIsAuthModalOpen(true);
                  else setCurrentTab('friends');
                }}
                className="text-xs font-semibold px-3 py-1 bg-[#167C49] text-white hover:bg-[#115D38] rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                Conectar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Orientações de Convivência e Segurança */}
      <div className="bg-[#EAF5EE]/60 rounded-2xl p-4 border border-[#167C49]/15 text-xs text-[#163D2B] space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-[#115D38] font-heading">
          <ShieldAlert size={16} />
          <span>Comunidade Segura & Respeitosa</span>
        </div>
        <p className="text-[12px] text-[#738078] leading-relaxed">
          O PapoBR valoriza o diálogo construtivo, combate o discurso de ódio e assegura a proteção integral de seus dados sob a LGPD brasileira.
        </p>
        <button
          onClick={() => setCurrentTab('settings')}
          className="text-xs font-bold text-[#167C49] flex items-center gap-1 hover:underline pt-1 cursor-pointer"
        >
          <span>Conheça as Diretrizes da Comunidade</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </aside>
  );
};
