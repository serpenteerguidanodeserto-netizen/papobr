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

interface SearchViewProps {
  initialQuery?: string;
  onAuthorClick?: (authorId: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ initialQuery = '', onAuthorClick }) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'people' | 'communities' | 'marketplace' | 'videos'>('all');

  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [marketplace, setMarketplace] = useState<MarketplaceItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);

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
          Encontre tudo o que acontece no PapoBR: pessoas, assuntos, comunidades e produtos.
        </p>

        <div className="relative mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite palavras-chave (ex: café, futebol, rio, tecnologia)..."
            className="w-full bg-[#F4F7F5] border border-[#E5EBE7] focus:border-[#167C49] focus:bg-white rounded-2xl py-3 pl-11 pr-4 text-sm text-[#163D2B] focus:outline-hidden"
          />
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#738078]" />
        </div>

        {/* Abas de Resultados */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'Tudo' },
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

      {/* Resultados: Publicações */}
      {(activeTab === 'all' || activeTab === 'posts') && (
        <div className="space-y-4">
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
        <div className="space-y-3 pt-3">
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
        <div className="space-y-3 pt-3">
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
