/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  Clock,
  Image as ImageIcon,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { Post } from '../../types';
import { PostCreator } from './PostCreator';
import { PostCard } from './PostCard';
import {
  subscribeToPosts,
  seedInitialPostsIfEmpty,
} from '../../services/postsService';

interface FeedViewProps {
  onAuthorClick?: (authorId: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({ onAuthorClick }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedFilter, setFeedFilter] = useState<'all' | 'popular' | 'media'>('all');

  useEffect(() => {
    // Check initial seed
    seedInitialPostsIfEmpty();

    const unsub = subscribeToPosts(
      (items) => {
        setPosts(items);
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao subscrever posts:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (feedFilter === 'popular') {
      return (post.likesCount || 0) >= 50;
    }
    if (feedFilter === 'media') {
      return post.imageUrls && post.imageUrls.length > 0;
    }
    return true;
  });

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-12">
      {/* Banner Institucional Oficial PapoBR */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#115D38] via-[#167C49] to-[#0D4B2C] text-white p-6 sm:p-8 shadow-md">
        {/* Detalhes gráficos sutis em amarelo e verde */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-[#F3C84B]/15 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
        
        {/* Mini selo de autenticidade brasileira */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[#F3C84B] text-xs font-bold mb-3 border border-white/10">
          <Sparkles size={14} />
          <span>Rede Social 100% Brasileira</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading leading-tight mb-2">
          Seu espaço. <br className="hidden sm:inline" />
          <span className="text-[#F3C84B]">Seu povo.</span> Seu papo.
        </h1>

        <p className="text-sm sm:text-base text-[#EAF5EE] max-w-lg leading-relaxed font-normal">
          Compartilhe ideias, descubra comunidades e fique perto de quem importa. O Brasil se encontra aqui.
        </p>

        {/* Três pilares */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-white/15 text-center text-xs">
          <div>
            <span className="block text-base sm:text-lg font-extrabold text-[#F3C84B] font-heading">Livre</span>
            <span className="text-white/80 text-[11px]">Sem algoritmos tóxicos</span>
          </div>
          <div>
            <span className="block text-base sm:text-lg font-extrabold text-[#F3C84B] font-heading">Seguro</span>
            <span className="text-white/80 text-[11px]">Proteção LGPD ativa</span>
          </div>
          <div>
            <span className="block text-base sm:text-lg font-extrabold text-[#F3C84B] font-heading">Nosso</span>
            <span className="text-white/80 text-[11px]">De norte a sul</span>
          </div>
        </div>
      </section>

      {/* Formulário de Criação de Publicação */}
      <PostCreator />

      {/* Filtros do Feed */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-[#E5EBE7] shadow-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFeedFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              feedFilter === 'all'
                ? 'bg-[#EAF5EE] text-[#167C49]'
                : 'text-[#738078] hover:text-[#163D2B]'
            }`}
          >
            <Clock size={14} />
            <span>Mais Recentes</span>
          </button>

          <button
            onClick={() => setFeedFilter('popular')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              feedFilter === 'popular'
                ? 'bg-[#EAF5EE] text-[#167C49]'
                : 'text-[#738078] hover:text-[#163D2B]'
            }`}
          >
            <Flame size={14} />
            <span>Em Alta</span>
          </button>

          <button
            onClick={() => setFeedFilter('media')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              feedFilter === 'media'
                ? 'bg-[#EAF5EE] text-[#167C49]'
                : 'text-[#738078] hover:text-[#163D2B]'
            }`}
          >
            <ImageIcon size={14} />
            <span>Fotos</span>
          </button>
        </div>

        <span className="text-xs text-[#738078] font-medium hidden sm:inline">
          {filteredPosts.length} {filteredPosts.length === 1 ? 'publicação' : 'publicações'}
        </span>
      </div>

      {/* Lista de Publicações */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl p-5 border border-[#E5EBE7] animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gray-200 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-32 h-3.5 bg-gray-200 rounded-sm" />
                  <div className="w-20 h-2.5 bg-gray-200 rounded-sm" />
                </div>
              </div>
              <div className="w-full h-16 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onAuthorClick={onAuthorClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-white rounded-2xl border border-[#E5EBE7]">
          <MessageSquare size={36} className="mx-auto text-[#167C49] mb-3 opacity-60" />
          <h3 className="text-base font-bold text-[#163D2B] font-heading mb-1">
            Nenhuma publicação encontrada
          </h3>
          <p className="text-xs text-[#738078] max-w-sm mx-auto mb-4">
            Aproveite para ser a primeira pessoa a compartilhar um pensamento com o Brasil hoje!
          </p>
        </div>
      )}
    </div>
  );
};
