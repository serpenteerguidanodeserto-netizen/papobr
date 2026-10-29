/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Plus,
  Users,
  Search,
  Check,
  X,
  Loader2,
  Sparkles,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';
import { Community, Post } from '../../types';
import {
  subscribeToCommunities,
  createCommunity,
  seedCommunitiesIfEmpty,
} from '../../services/socialService';
import { subscribeToCommunityPosts } from '../../services/postsService';
import { PostCreator } from '../feed/PostCreator';
import { PostCard } from '../feed/PostCard';
import { useAuth } from '../../context/AuthContext';

interface CommunitiesViewProps {
  onSelectCommunity?: (community: Community) => void;
}

export const CommunitiesView: React.FC<CommunitiesViewProps> = () => {
  const { user, profile, setIsAuthModalOpen } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [search, setSearch] = useState('');
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // New community form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cultura & Tradição');
  const [loading, setLoading] = useState(false);

  const categories = [
    'Todas',
    'Gastronomia',
    'Esportes',
    'Tecnologia',
    'Cultura',
    'Cultura & Tradição',
    'Natureza & Viagens',
  ];

  const [selectedCat, setSelectedCat] = useState('Todas');

  useEffect(() => {
    seedCommunitiesIfEmpty();
    const unsub = subscribeToCommunities((list) => {
      setCommunities(list);
    });
    return () => unsub();
  }, []);

  // Listen to posts when an active community is open
  useEffect(() => {
    if (!activeCommunity) return;
    setLoadingPosts(true);
    const unsub = subscribeToCommunityPosts(activeCommunity.id, (posts) => {
      setCommunityPosts(posts);
      setLoadingPosts(false);
    });
    return () => unsub();
  }, [activeCommunity]);

  const handleToggleJoin = (commId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setJoinedMap((prev) => ({ ...prev, [commId]: !prev[commId] }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      setLoading(true);
      await createCommunity(profile, {
        name: name.trim(),
        description: description.trim(),
        category,
      });
      setIsModalOpen(false);
      setName('');
      setDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = communities.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'Todas' || c.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  // Visão detalhada de uma Comunidade com seu Feed
  if (activeCommunity) {
    const isMember = joinedMap[activeCommunity.id];
    return (
      <div className="max-w-2xl mx-auto space-y-5 pb-12">
        {/* Botão Voltar */}
        <button
          onClick={() => setActiveCommunity(null)}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#167C49] hover:text-[#115D38] bg-white px-3.5 py-2 rounded-xl border border-[#E5EBE7] shadow-xs cursor-pointer transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Voltar para todas as comunidades</span>
        </button>

        {/* Card do Cabeçalho da Comunidade */}
        <div className="bg-white rounded-3xl overflow-hidden border border-[#E5EBE7] shadow-xs">
          <div className="relative h-44 bg-gray-200">
            <img
              src={activeCommunity.coverURL || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'}
              alt={activeCommunity.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
              {activeCommunity.category}
            </span>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 -mt-12 mb-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={activeCommunity.imageURL || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&q=80'}
                  alt={activeCommunity.name}
                  className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                />
                <div className="pt-8">
                  <h1 className="text-lg sm:text-xl font-extrabold text-[#163D2B] font-heading">
                    {activeCommunity.name}
                  </h1>
                  <p className="text-xs text-[#738078] flex items-center gap-1">
                    <Users size={13} className="text-[#167C49]" />
                    {(activeCommunity.membersCount || 1) + (isMember ? 1 : 0)} membros brasileiros
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => handleToggleJoin(activeCommunity.id, e)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                  isMember
                    ? 'bg-[#EAF5EE] text-[#167C49] border border-[#167C49]/30'
                    : 'bg-[#167C49] hover:bg-[#115D38] text-white'
                }`}
              >
                {isMember ? (
                  <>
                    <Check size={14} />
                    <span>Participando</span>
                  </>
                ) : (
                  <span>Entrar na Comunidade</span>
                )}
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#738078] leading-relaxed">
              {activeCommunity.description}
            </p>
          </div>
        </div>

        {/* Publicador específico desta comunidade */}
        <PostCreator
          communityId={activeCommunity.id}
          communityName={activeCommunity.name}
        />

        {/* Feed de publicações da comunidade */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#163D2B] font-heading flex items-center gap-2 px-1">
            <MessageSquare size={16} className="text-[#167C49]" />
            <span>Papo na Comunidade</span>
          </h3>

          {loadingPosts ? (
            <div className="p-8 bg-white rounded-2xl text-center text-xs text-[#738078] border border-[#E5EBE7]">
              Carregando publicações...
            </div>
          ) : communityPosts.length > 0 ? (
            communityPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-[#738078] border border-[#E5EBE7]">
              <p className="font-bold text-[#163D2B] mb-1">Seja o pioneiro nesta comunidade!</p>
              <p>Compartilhe o primeiro papo ou foto acima.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header com chamada para criar comunidade */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5EBE7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EE] text-[#167C49] text-xs font-bold mb-2">
            <Compass size={14} />
            <span>Comunidades Brasileiras</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#163D2B] font-heading">
            Grupos e Resenhas do Nosso Brasil
          </h1>
          <p className="text-xs sm:text-sm text-[#738078] mt-1">
            Encontre quem divide os mesmos gostos por música, culinária, futebol, trabalho e hobbies.
          </p>
        </div>

        <button
          onClick={() => {
            if (!user) setIsAuthModalOpen(true);
            else setIsModalOpen(true);
          }}
          className="bg-[#167C49] hover:bg-[#115D38] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus size={18} />
          <span>Criar Comunidade</span>
        </button>
      </div>

      {/* Busca e Filtro de Categorias */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5EBE7] shadow-xs space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#738078]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar comunidades por nome ou tema..."
            className="w-full bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl py-2 pl-9 pr-3 text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCat === cat
                  ? 'bg-[#167C49] text-white font-bold'
                  : 'bg-[#F4F7F5] text-[#738078] hover:text-[#163D2B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Comunidades */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((comm) => {
          const isMember = joinedMap[comm.id];
          return (
            <div
              key={comm.id}
              onClick={() => setActiveCommunity(comm)}
              className="bg-white rounded-3xl overflow-hidden border border-[#E5EBE7] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-28 bg-gray-100 overflow-hidden">
                  <img
                    src={comm.coverURL || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80'}
                    alt="Capa"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {comm.category}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-3 -mt-10 mb-3">
                    <img
                      src={comm.imageURL || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&q=80'}
                      alt={comm.name}
                      className="w-14 h-14 rounded-2xl object-cover border-3 border-white shadow-md bg-white"
                    />
                    <div className="pt-6">
                      <h3 className="text-sm font-bold text-[#163D2B] font-heading line-clamp-1 group-hover:text-[#167C49] transition-colors">
                        {comm.name}
                      </h3>
                      <p className="text-[11px] text-[#738078] flex items-center gap-1">
                        <Users size={12} className="text-[#167C49]" />
                        {(comm.membersCount || 0) + (isMember ? 1 : 0)} membros
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#738078] line-clamp-2 leading-relaxed">
                    {comm.description}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 border-t border-[#E5EBE7]/60 flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#738078]">
                  Criado por {comm.creatorName || 'PapoBR'}
                </span>
                <button
                  onClick={(e) => handleToggleJoin(comm.id, e)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                    isMember
                      ? 'bg-[#EAF5EE] text-[#167C49] border border-[#167C49]/30'
                      : 'bg-[#167C49] hover:bg-[#115D38] text-white'
                  }`}
                >
                  {isMember ? (
                    <>
                      <Check size={14} />
                      <span>Participando</span>
                    </>
                  ) : (
                    <span>Entrar no Grupo</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Criar Comunidade */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#E5EBE7] shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-[#738078] hover:bg-[#F4F7F5] rounded-full"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-[#163D2B] font-heading mb-3">
              Criar Nova Comunidade no PapoBR
            </h3>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#163D2B] mb-1">
                  Nome da Comunidade
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Pão de Queijo & Cafezinho ☕"
                  className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#163D2B] mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:outline-hidden"
                >
                  {categories.filter((c) => c !== 'Todas').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#163D2B] mb-1">
                  Descrição e Propósito
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique o que as pessoas vão encontrar e conversar nesta comunidade..."
                  className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5EBE7]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#738078] hover:bg-[#F4F7F5] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#167C49] hover:bg-[#115D38] text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>Criar Grupo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
