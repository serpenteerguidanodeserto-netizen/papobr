/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  Check,
  X,
  Search,
  MessageSquare,
  Sparkles,
  UserMinus,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FriendRequest, UserProfile } from '../../types';
import {
  subscribeToFriendRequests,
  respondToFriendRequest,
  sendFriendRequest,
  cancelFriendRequest,
  removeFriendship,
} from '../../services/socialService';

interface FriendsViewProps {
  onStartChat?: (user: { uid: string; displayName: string; username: string; photoURL?: string }) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ onStartChat }) => {
  const { user, profile, setIsAuthModalOpen } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'suggestions' | 'myFriends'>('suggestions');
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({});
  const [myFriends, setMyFriends] = useState<UserProfile[]>([
    {
      uid: 'user_mariana',
      displayName: 'Mariana Azevedo',
      username: 'mariana_az',
      email: 'mariana@papobr.com.br',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      bio: 'Jornalista e fotógrafa apaixonada por São Paulo.',
      city: 'São Paulo',
      state: 'SP',
      createdAt: new Date().toISOString(),
      friendsCount: 64,
    },
    {
      uid: 'user_cadu',
      displayName: 'Carlos Eduardo',
      username: 'cadu_rio',
      email: 'cadu@papobr.com.br',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      bio: 'Designer carioca, trilheiro e fã de bossa nova.',
      city: 'Rio de Janeiro',
      state: 'RJ',
      createdAt: new Date().toISOString(),
      friendsCount: 92,
    },
    {
      uid: 'user_beatriz',
      displayName: 'Beatriz Martins',
      username: 'biamartins',
      email: 'beatriz@papobr.com.br',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      bio: 'Bióloga mineira, pesquisadora da flora brasileira.',
      city: 'Belo Horizonte',
      state: 'MG',
      createdAt: new Date().toISOString(),
      friendsCount: 45,
    },
  ]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToFriendRequests(user.uid, (list) => {
      setRequests(list);
    });
    return () => unsub();
  }, [user]);

  const mockSuggestions: UserProfile[] = [
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
      uid: 'user_tales',
      displayName: 'Tales Silveira',
      username: 'talessilveira',
      email: 'tales@exemplo.com.br',
      photoURL: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
      bio: 'Chef e pesquisador da culinária amazônica e paraense.',
      city: 'Belém',
      state: 'PA',
      createdAt: new Date().toISOString(),
      friendsCount: 76,
    },
  ];

  const handleSendRequest = async (target: UserProfile) => {
    if (!user || !profile) {
      setIsAuthModalOpen(true);
      return;
    }
    setSentRequests((prev) => ({ ...prev, [target.uid]: true }));
    try {
      await sendFriendRequest(profile, target);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelRequest = async (targetUid: string) => {
    if (!profile) return;
    setSentRequests((prev) => ({ ...prev, [targetUid]: false }));
    const requestId = `${profile.uid}_${targetUid}`;
    try {
      await cancelFriendRequest(requestId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRespond = async (requestId: string, status: 'accepted' | 'rejected') => {
    if (!profile) return;
    try {
      await respondToFriendRequest(requestId, status, profile);
      if (status === 'accepted') {
        const acceptedReq = requests.find((r) => r.id === requestId);
        if (acceptedReq) {
          setMyFriends((prev) => [
            {
              uid: acceptedReq.senderId,
              displayName: acceptedReq.senderName,
              username: acceptedReq.senderUsername,
              email: '',
              photoURL: acceptedReq.senderPhotoURL,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFriend = (friendUid: string) => {
    if (!confirm('Deseja realmente desfazer esta amizade?')) return;
    setMyFriends((prev) => prev.filter((f) => f.uid !== friendUid));
  };

  const queryClean = searchFilter.toLowerCase().trim();

  const filteredSuggestions = mockSuggestions.filter((s) =>
    queryClean
      ? s.displayName.toLowerCase().includes(queryClean) ||
        s.username.toLowerCase().includes(queryClean) ||
        (s.city && s.city.toLowerCase().includes(queryClean)) ||
        (s.state && s.state.toLowerCase().includes(queryClean))
      : true
  );

  const filteredFriends = myFriends.filter((f) =>
    queryClean
      ? f.displayName.toLowerCase().includes(queryClean) ||
        f.username.toLowerCase().includes(queryClean) ||
        (f.city && f.city.toLowerCase().includes(queryClean))
      : true
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5EBE7] shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5EBE7]">
          <div>
            <h1 className="text-xl font-extrabold text-[#163D2B] font-heading flex items-center gap-2">
              <Users size={22} className="text-[#167C49]" />
              <span>Amigos & Conexões no Brasil</span>
            </h1>
            <p className="text-xs text-[#738078] mt-0.5">
              Conheça brasileiros de todas as regiões, expanda sua rede e troque ideias.
            </p>
          </div>
        </div>

        {/* Campo de Busca Rápida por nome, arroba ou estado */}
        <div className="relative mt-4">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Pesquisar pessoas por nome, @usuario ou cidade/UF..."
            className="w-full bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl py-2 pl-9 pr-3 text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:outline-hidden"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#738078]" />
        </div>

        {/* Abas */}
        <div className="flex bg-[#F4F7F5] p-1 rounded-2xl mt-4">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'suggestions'
                ? 'bg-white text-[#167C49] shadow-xs'
                : 'text-[#738078] hover:text-[#163D2B]'
            }`}
          >
            Sugestões ({filteredSuggestions.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-white text-[#167C49] shadow-xs'
                : 'text-[#738078] hover:text-[#163D2B]'
            }`}
          >
            <span>Solicitações</span>
            {requests.length > 0 && (
              <span className="bg-[#F3C84B] text-[#163D2B] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {requests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('myFriends')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'myFriends'
                ? 'bg-white text-[#167C49] shadow-xs'
                : 'text-[#738078] hover:text-[#163D2B]'
            }`}
          >
            Meus Amigos ({filteredFriends.length})
          </button>
        </div>
      </div>

      {/* Conteúdo: Solicitações de amizade */}
      {activeTab === 'requests' && (
        <div className="space-y-3">
          {requests.length > 0 ? (
            requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-4 border border-[#E5EBE7] flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      req.senderPhotoURL ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.senderUsername}`
                    }
                    alt={req.senderName}
                    className="w-12 h-12 rounded-full object-cover border border-[#167C49]/20"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[#163D2B] font-heading">
                      {req.senderName}
                    </h4>
                    <p className="text-xs text-[#738078]">@{req.senderUsername}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRespond(req.id, 'accepted')}
                    className="p-2 bg-[#167C49] hover:bg-[#115D38] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Check size={16} />
                    <span className="hidden sm:inline">Aceitar</span>
                  </button>
                  <button
                    onClick={() => handleRespond(req.id, 'rejected')}
                    className="p-2 bg-[#F4F7F5] hover:bg-gray-200 text-[#738078] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <X size={16} />
                    <span className="hidden sm:inline">Recusar</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-[#E5EBE7]">
              <p className="text-xs text-[#738078]">
                Nenhuma solicitação pendente no momento.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo: Sugestões de pessoas */}
      {activeTab === 'suggestions' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredSuggestions.map((sug) => {
            const hasSent = sentRequests[sug.uid];
            return (
              <div
                key={sug.uid}
                className="bg-white rounded-2xl p-4 border border-[#E5EBE7] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2.5">
                    <img
                      src={sug.photoURL}
                      alt={sug.displayName}
                      className="w-12 h-12 rounded-full object-cover border border-[#167C49]/20"
                    />
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-bold text-[#163D2B] font-heading truncate">
                        {sug.displayName}
                      </h4>
                      <p className="text-xs text-[#738078] truncate">@{sug.username}</p>
                      {sug.city && sug.state && (
                        <p className="text-[11px] text-[#167C49] font-medium flex items-center gap-1">
                          <MapPin size={11} />
                          {sug.city}, {sug.state}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[#738078] line-clamp-2 mb-3">
                    {sug.bio}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#E5EBE7]/50">
                  {hasSent ? (
                    <button
                      onClick={() => handleCancelRequest(sug.uid)}
                      className="w-full py-1.5 rounded-xl text-xs font-bold text-[#738078] hover:text-red-600 bg-[#F4F7F5] hover:bg-red-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <X size={13} />
                      <span>Cancelar Solicitação</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(sug)}
                      className="w-full py-1.5 rounded-xl text-xs font-bold bg-[#167C49] hover:bg-[#115D38] text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <UserPlus size={14} />
                      <span>Adicionar Amigo</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Conteúdo: Meus amigos */}
      {activeTab === 'myFriends' && (
        <div className="space-y-3">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <div
                key={friend.uid}
                className="bg-white rounded-2xl p-4 border border-[#E5EBE7] flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                    alt={friend.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[#163D2B] font-heading">
                      {friend.displayName}
                    </h4>
                    <p className="text-xs text-[#738078]">
                      @{friend.username} {friend.city ? `• 📍 ${friend.city}, ${friend.state}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStartChat?.(friend)}
                    className="px-3 py-1.5 bg-[#EAF5EE] hover:bg-[#167C49] hover:text-white text-[#167C49] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare size={14} />
                    <span className="hidden sm:inline">Conversar</span>
                  </button>

                  <button
                    onClick={() => handleRemoveFriend(friend.uid)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Desfazer amizade"
                  >
                    <UserMinus size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-[#E5EBE7]">
              <p className="text-xs text-[#738078]">Nenhum amigo encontrado nesta busca.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
