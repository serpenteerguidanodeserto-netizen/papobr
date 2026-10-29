/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  User,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Conversation, Message } from '../../types';
import {
  subscribeToUserConversations,
  subscribeToMessages,
  sendDirectMessage,
} from '../../services/socialService';
import { formatRelativeTime } from '../../lib/utils';

interface MessagesViewProps {
  initialChatUser?: { uid: string; displayName: string; username: string; photoURL?: string } | null;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ initialChatUser }) => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<{
    uid: string;
    displayName: string;
    username: string;
    photoURL?: string;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-select initial chat user if passed
  useEffect(() => {
    if (initialChatUser && user) {
      setSelectedRecipient(initialChatUser);
      // Determine conversation ID deterministic
      const convId = [user.uid, initialChatUser.uid].sort().join('_');
      setSelectedConvId(convId);
    }
  }, [initialChatUser, user]);

  // Subscribe to user conversations
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserConversations(user.uid, (list) => {
      setConversations(list);
      // Select first conversation if none selected
      if (!selectedConvId && list.length > 0) {
        const first = list[0];
        setSelectedConvId(first.id);
        const otherUid = first.participantIds.find((id) => id !== user.uid);
        if (otherUid && first.participants[otherUid]) {
          setSelectedRecipient({
            uid: otherUid,
            ...first.participants[otherUid],
          });
        }
      }
    });
    return () => unsub();
  }, [user, selectedConvId]);

  // Subscribe to messages in active conversation
  useEffect(() => {
    if (!selectedConvId) return;
    const unsub = subscribeToMessages(selectedConvId, (list) => {
      setMessages(list);
    });
    return () => unsub();
  }, [selectedConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !selectedConvId || !selectedRecipient || !inputMessage.trim()) return;

    const text = inputMessage.trim();
    setInputMessage('');
    try {
      setSending(true);
      await sendDirectMessage(selectedConvId, profile, selectedRecipient, text);
    } catch (err) {
      console.error('Falha ao enviar mensagem:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConvId(conv.id);
    if (!user) return;
    const otherUid = conv.participantIds.find((id) => id !== user.uid);
    if (otherUid && conv.participants[otherUid]) {
      setSelectedRecipient({
        uid: otherUid,
        ...conv.participants[otherUid],
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] min-h-[500px] bg-white rounded-3xl border border-[#E5EBE7] shadow-sm flex overflow-hidden">
      {/* Coluna Esquerda: Lista de Conversas */}
      <div className="w-full sm:w-80 border-r border-[#E5EBE7] flex flex-col h-full bg-[#F4F7F5]/50">
        <div className="p-4 border-b border-[#E5EBE7] bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-[#163D2B] font-heading flex items-center gap-2">
              <MessageSquare size={18} className="text-[#167C49]" />
              <span>Mensagens</span>
            </h2>
            <span className="text-[11px] bg-[#EAF5EE] text-[#167C49] font-bold px-2 py-0.5 rounded-full">
              Privado
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Buscar conversas..."
              className="w-full bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl py-1.5 pl-8 pr-3 text-xs text-[#163D2B] focus:bg-white focus:outline-hidden"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#738078]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#E5EBE7]/60">
          {conversations.length > 0 ? (
            conversations.map((conv) => {
              const otherUid = user ? conv.participantIds.find((id) => id !== user.uid) : null;
              const participant = otherUid ? conv.participants?.[otherUid] : null;
              const isSelected = selectedConvId === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv)}
                  className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#EAF5EE]' : 'hover:bg-white'
                  }`}
                >
                  <img
                    src={
                      participant?.photoURL ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant?.username || 'user'}`
                    }
                    alt={participant?.displayName || 'Contato'}
                    className="w-11 h-11 rounded-full object-cover shrink-0 border border-[#167C49]/20"
                  />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-[#163D2B] truncate font-heading">
                        {participant?.displayName || 'Brasileiro'}
                      </h4>
                      <span className="text-[10px] text-[#738078] shrink-0">
                        {formatRelativeTime(conv.updatedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#738078] truncate">
                      {conv.lastMessageText || 'Nova conversa iniciada'}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-[#738078]">
              <p>Nenhuma conversa ativa no momento.</p>
              <p className="mt-1 text-[11px]">Vá na aba "Amigos" para puxar um papo com alguém!</p>
            </div>
          )}
        </div>
      </div>

      {/* Coluna Direita: Conversa Ativa */}
      <div className="flex-1 flex flex-col h-full bg-white">
        {selectedRecipient ? (
          <>
            {/* Header da conversa */}
            <div className="p-3.5 sm:p-4 border-b border-[#E5EBE7] flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedRecipient.photoURL ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedRecipient.username}`
                  }
                  alt={selectedRecipient.displayName}
                  className="w-10 h-10 rounded-full object-cover border border-[#167C49]/20"
                />
                <div>
                  <h3 className="text-sm font-bold text-[#163D2B] font-heading">
                    {selectedRecipient.displayName}
                  </h3>
                  <p className="text-[11px] text-[#738078]">
                    @{selectedRecipient.username} • Papo direto protegido
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#167C49] font-medium bg-[#EAF5EE] px-2.5 py-1 rounded-full">
                <ShieldCheck size={14} />
                <span className="hidden sm:inline">Criptografia em trânsito</span>
              </div>
            </div>

            {/* Histórico de Mensagens */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F4F7F5]/30">
              {messages.length > 0 ? (
                messages.map((msg) => {
                  const isMine = msg.senderId === user?.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                          isMine
                            ? 'bg-[#167C49] text-white rounded-br-xs'
                            : 'bg-white text-[#163D2B] border border-[#E5EBE7] rounded-bl-xs'
                        }`}
                      >
                        <p>{msg.text}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-[#738078] px-1">
                        <span>{formatRelativeTime(msg.createdAt)}</span>
                        {isMine && <CheckCheck size={12} className="text-[#167C49]" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-[#738078]">
                  <MessageSquare size={32} className="text-[#167C49] mb-2 opacity-40" />
                  <p className="font-bold text-[#163D2B]">Inicie a conversa!</p>
                  <p>Envie uma mensagem amigável para trocar uma ideia.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input para envio */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 border-t border-[#E5EBE7] bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Mande um papo para ${selectedRecipient.displayName}...`}
                className="flex-1 bg-[#F4F7F5] border border-[#E5EBE7] focus:border-[#167C49] focus:bg-white rounded-full py-2.5 px-4 text-xs sm:text-sm text-[#163D2B] focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={sending || !inputMessage.trim()}
                className="p-2.5 bg-[#167C49] hover:bg-[#115D38] disabled:opacity-40 text-white rounded-full transition-colors cursor-pointer shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#738078]">
            <MessageSquare size={44} className="text-[#167C49] mb-3 opacity-30" />
            <h3 className="text-base font-bold text-[#163D2B] font-heading mb-1">
              Suas Mensagens no PapoBR
            </h3>
            <p className="text-xs max-w-xs">
              Selecione uma conversa ao lado ou inicie um bate-papo a partir do perfil de um amigo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
