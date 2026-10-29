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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FriendRequest, UserProfile } from '../../types';
import {
  subscribeToFriendRequests,
  respondToFriendRequest,
  sendFriendRequest,
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

  const handleRespond = async (requestId: string, status: 'accepted' | 'rejected') => {
    if (!profile) return;
    try {
      await respondToFriendRequest(requestId, status, profile);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5EBE7] shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5EBE7]">
          <div>
            <h1 className="text-xl font-extrabold text-[#163D2B] font-heading">
              Amizades & Conexões
            </h1>
            <p className="text-xs text-[#738078] mt-0.5">
              Conheça brasileiros de todas as regiões e construa sua rede.
            </p>
          </div>
          <Users size={24} className="text-[#167C49]" />
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
            Sugestões
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
            Meus Amigos
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
          {mockSuggestions.map((sug) => {
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
                      <p className="text-[11px] text-[#167C49] font-medium">
                        📍 {sug.city}, {sug.state}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-[#738078] line-clamp-2 mb-3">
                    {sug.bio}
                  </p>
                </div>

                <button
                  onClick={() => handleSendRequest(sug)}
                  disabled={hasSent}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    hasSent
                      ? 'bg-[#EAF5EE] text-[#167C49]'
                      : 'bg-[#167C49] hover:bg-[#115D38] text-white'
                  }`}
                >
                  {hasSent ? (
                    <>
                      <UserCheck size={14} />
                      <span>Solicitação Enviada</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>Adicionar Amigo</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Conteúdo: Meus amigos */}
      {activeTab === 'myFriends' && (
        <div className="space-y-3">
          {mockSuggestions.slice(0, 3).map((friend) => (
            <div
              key={friend.uid}
              className="bg-white rounded-2xl p-4 border border-[#E5EBE7] flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <img
                  src={friend.photoURL}
                  alt={friend.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-sm font-bold text-[#163D2B] font-heading">
                    {friend.displayName}
                  </h4>
                  <p className="text-xs text-[#738078]">@{friend.username} • 📍 {friend.city}, {friend.state}</p>
                </div>
              </div>

              <button
                onClick={() => onStartChat?.(friend)}
                className="px-3.5 py-1.5 bg-[#EAF5EE] hover:bg-[#167C49] hover:text-white text-[#167C49] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare size={14} />
                <span>Conversar</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
