/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  Compass,
  FileText,
  ShoppingBag,
  PlaySquare,
  Sparkles,
  MapPin,
  UserPlus,
} from 'lucide-react';
import { Post, Community, MarketplaceItem, VideoItem, UserProfile } from '../../types';
import { PostCard } from '../feed/PostCard';
import { subscribeToPosts } from '../../services/postsService';
import {
  subscribeToCommunities,
  subscribeToMarketplace,
  subscribeToVideos,
} from '../../services/socialService';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface SearchViewProps {
  initialQuery?: string;
  onAuthorClick?: (authorId: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ initialQuery = '', onAuthorClick }) => {
  const { user, setIsAuthModalOpen } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'people' | 'communities' | 'marketplace' | 'videos'>('all');

  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [marketplace, setMarketplace] = useState<MarketplaceItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);

  const mockPeople: UserProfile[] = [
    {
      uid: 'user_camila',
      displayName: 'Camila Rocha',
      username: 'camilasurf',
      email: 'camila@exemplo.com.br',
      photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      bio: 'Amante da praia, esportes e fotografia ao ar livre.',
      city: 'Florianópolis',
      state: 'SC',
      createdAt: new Date().toISOString(),
      friendsCount: 42,
    },
    {
      uid: 'user_felipe',
      displayName: 'Felipe Duarte',
      username: 'feliped_mg',
      email: 'felipe@exemplo.com.br',
      photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
      bio: 'Arquiteto de software, violonista amador e apaixonado por café.',
      city: 'Belo Horizonte',
      state: 'MG',
      createdAt: new Date().toISOString(),
      friendsCount: 88,
    },
    {
      uid: 'user_larissa',
      displayName: 'Larissa Albuquerque',
      username: 'larissa_nordeste',
      email: 'larissa@exemplo.com.br',
      photoURL: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
      bio: 'Empreendedora no setor de turismo e defensora da cultura regional.',
      city: 'Recife',
      state: 'PE',
      createdAt: new Date().toISOString(),
      friendsCount: 110,
    },
    {
      uid: 'user_roberto',
      displayName: 'Roberto Mendes',
      username: 'robertomendes',
      email: 'roberto@exemplo.com.br',
      photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      bio: 'Ciclista urbano e entusiasta de energia solar.',
      city: 'Curitiba',
      state: 'PR',
      createdAt: new Date().toISOString(),
      friendsCount: 54,
    },
    {
      uid: 'user_ana_carolina',
      displayName: 'Ana Carolina Dias',
      username: 'anadias_sp',
      email: 'ana@exemplo.com.br',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      bio: 'Desenvolvedora front-end e apaixonada por café paulistano.',
      city: 'São Paulo',
      state: 'SP',
      createdAt: new Date().toISOString(),
      friendsCount: 120,
    },
  ];

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const unsubPosts = subscribeToPosts((list) => setPosts(list));
    const unsubComm = subscribeToCommunities((list) => setCommunities(list));
    const unsubMark = subscribeToMarketplace((list) => setMarketplace(list));
    const unsubVid = subscribeToVideos((list) => setVideos(list));

    return () => {
      unsubPosts();
      unsubComm();
      unsubMark();
      unsubVid();
    };
  }, []);

  const cleanQuery = query.toLowerCase().trim();

  const filteredPosts = posts.filter((p) =>
    cleanQuery ? p.content.toLowerCase().includes(cleanQuery) || p.tags?.some((t) => t.toLowerCase().includes(cleanQuery)) : true
  );

  const filteredPeople = mockPeople.filter((p) =>
    cleanQuery
      ? p.displayName.toLowerCase().includes(cleanQuery) ||
        p.username.toLowerCase().includes(cleanQuery) ||
        (p.city && p.city.toLowerCase().includes(cleanQuery))
      : true
  );

  const filteredCommunities = communities.filter((c) =>
    cleanQuery ? c.name.toLowerCase().includes(cleanQuery) || c.description.toLowerCase().includes(cleanQuery) : true
  );

  const filteredMarketplace = marketplace.filter((m) =>
    cleanQuery ? m.title.toLowerCase().includes(cleanQuery) || m.description.toLowerCase().includes(cleanQuery) : true
  );

  const filteredVideos = videos.filter((v) =>
    cleanQuery ? v.title.toLowerCase().includes(cleanQuery) || v.description.toLowerCase().includes(cleanQuery) : true
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      {/* Barra de Pesquisa */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5EBE7] shadow-xs">
        <h1 className="text-xl font-extrabold text-[#163D2B] font-heading mb-1">
          Pesquisa & Descoberta
        </h1>
        <p className="text-xs text-[#738078] mb-4">
          Encontre pessoas, comunidades, publicações, vídeos e produtos no Brasil.
        </p>

        <div className="relative mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite palavras-chave (ex: café, são paulo, tecnologia, futebol)..."
            className="w-full bg-[#F4F7F5] border border-[#E5EBE7] focus:border-[#167C49] focus:bg-white rounded-2xl py-3 pl-11 pr-4 text-sm text-[#163D2B] focus:outline-hidden"
          />
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#738078]" />
        </div>

        {/* Abas de Resultados */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'Tudo' },
            { id: 'people', label: `Pessoas (${filteredPeople.length})` },
            { id: 'posts', label: `Publicações (${filteredPosts.length})` },
            { id: 'communities', label: `Comunidades (${filteredCommunities.length})` },
            { id: 'marketplace', label: `Marketplace (${filteredMarketplace.length})` },
            { id: 'videos', label: `Vídeos (${filteredVideos.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#167C49] text-white shadow-xs'
                  : 'bg-[#F4F7F5] text-[#738078] hover:text-[#163D2B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resultados: Pessoas */}
      {(activeTab === 'all' || activeTab === 'people') && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#163D2B] font-heading flex items-center gap-1.5 px-1">
            <Users size={16} className="text-[#167C49]" />
            <span>Pessoas no Brasil</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPeople.map((person) => (
              <div
                key={person.uid}
                className="bg-white p-4 rounded-2xl border border-[#E5EBE7] shadow-xs flex items-center justify-between gap-3"
              >
                <div
                  onClick={() => onAuthorClick?.(person.uid)}
                  className="flex items-center gap-3 cursor-pointer overflow-hidden"
                >
                  <img
                    src={person.photoURL}
                    alt={person.displayName}
                    className="w-12 h-12 rounded-full object-cover shrink-0 border border-[#167C49]/20"
                  />
                  <div className="overflow-hidden">
                    <h4 className="text-xs sm:text-sm font-bold text-[#163D2B] truncate font-heading hover:text-[#167C49] transition-colors">
                      {person.displayName}
                    </h4>
                    <p className="text-xs text-[#738078] truncate">@{person.username}</p>
                    {person.city && (
                      <span className="text-[11px] text-[#167C49] font-medium flex items-center gap-0.5">
                        <MapPin size={11} />
                        {person.city}, {person.state}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!user) setIsAuthModalOpen(true);
                    else alert(`Solicitação enviada para ${person.displayName}!`);
                  }}
                  className="px-3 py-1.5 bg-[#EAF5EE] hover:bg-[#167C49] hover:text-white text-[#167C49] rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer"
                >
                  Conectar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resultados: Publicações */}
      {(activeTab === 'all' || activeTab === 'posts') && (
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-[#163D2B] font-heading flex items-center gap-1.5 px-1">
            <FileText size={16} className="text-[#167C49]" />
            <span>Publicações</span>
          </h3>
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} onAuthorClick={onAuthorClick} />
            ))
          ) : (
            <div className="bg-white p-6 rounded-2xl text-center text-xs text-[#738078] border border-[#E5EBE7]">
              Nenhuma publicação corresponde à sua busca.
            </div>
          )}
        </div>
      )}

      {/* Resultados: Comunidades */}
      {(activeTab === 'all' || activeTab === 'communities') && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-[#163D2B] font-heading flex items-center gap-1.5 px-1">
            <Compass size={16} className="text-[#167C49]" />
            <span>Comunidades</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredCommunities.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-[#E5EBE7] flex items-center gap-3">
                <img src={c.imageURL} alt={c.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-[#163D2B] truncate">{c.name}</h4>
                  <p className="text-[11px] text-[#738078] truncate">{c.description}</p>
                  <span className="text-[10px] text-[#167C49] font-medium">{c.membersCount} membros</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resultados: Marketplace */}
      {(activeTab === 'all' || activeTab === 'marketplace') && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-[#163D2B] font-heading flex items-center gap-1.5 px-1">
            <ShoppingBag size={16} className="text-[#167C49]" />
            <span>Anúncios no Mercado PapoBR</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {filteredMarketplace.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl overflow-hidden border border-[#E5EBE7] p-3">
                <img src={m.imageUrls?.[0]} alt={m.title} className="w-full h-28 object-cover rounded-xl mb-2" />
                <span className="text-xs font-extrabold text-[#167C49]">{formatCurrency(m.price)}</span>
                <p className="text-xs font-bold text-[#163D2B] truncate">{m.title}</p>
                <p className="text-[10px] text-[#738078]">📍 {m.city}, {m.state}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
