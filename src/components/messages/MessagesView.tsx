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
  Check,
  CheckCheck,
  Plus,
  ArrowLeft,
  Smile,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Conversation, Message, UserProfile } from '../../types';
import {
  subscribeToUserConversations,
  subscribeToMessages,
  sendDirectMessage,
  markConversationMessagesAsRead,
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
  const [searchContact, setSearchContact] = useState('');
  const [sending, setSending] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Contatos de exemplo para iniciar novo papo rápido
  const contactsList = [
    {
      uid: 'user_mariana',
      displayName: 'Mariana Azevedo',
      username: 'mariana_az',
      city: 'São Paulo, SP',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    },
    {
      uid: 'user_cadu',
      displayName: 'Carlos Eduardo',
      username: 'cadu_rio',
      city: 'Rio de Janeiro, RJ',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    {
      uid: 'user_beatriz',
      displayName: 'Beatriz Martins',
      username: 'biamartins',
      city: 'Belo Horizonte, MG',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    {
      uid: 'user_camila',
      displayName: 'Camila Rocha',
      username: 'camilasurf',
      city: 'Florianópolis, SC',
      photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    },
  ];

  const quickReactions = ['🇧🇷', '☕', '👍', '❤️', '👏', '⚽'];

  // Auto-select initial chat user if passed
  useEffect(() => {
    if (initialChatUser && user) {
      setSelectedRecipient(initialChatUser);
      const convId = [user.uid, initialChatUser.uid].sort().join('_');
      setSelectedConvId(convId);
    }
  }, [initialChatUser, user]);

  // Subscribe to user conversations
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserConversations(user.uid, (list) => {
      setConversations(list);
      // Auto select first if none selected on desktop
      if (!selectedConvId && list.length > 0 && window.innerWidth > 640) {
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
    if (!selectedConvId || !user) return;
    const unsub = subscribeToMessages(selectedConvId, (list) => {
      setMessages(list);
      // Marcar mensagens recebidas como lidas
      markConversationMessagesAsRead(selectedConvId, user.uid);
    });
    return () => unsub();
  }, [selectedConvId, user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!user || !profile || !selectedConvId || !selectedRecipient || !text) return;

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

  const handleStartNewChatWith = (contact: { uid: string; displayName: string; username: string; photoURL?: string }) => {
    if (!user) return;
    setSelectedRecipient(contact);
    const convId = [user.uid, contact.uid].sort().join('_');
    setSelectedConvId(convId);
    setIsNewChatModalOpen(false);
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchContact.trim() || !user) return true;
    const otherUid = conv.participantIds.find((id) => id !== user.uid);
    const participant = otherUid ? conv.participants?.[otherUid] : null;
    const q = searchContact.toLowerCase();
    return (
      participant?.displayName.toLowerCase().includes(q) ||
      participant?.username.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-130px)] min-h-[520px] bg-white rounded-3xl border border-[#E5EBE7] shadow-sm flex overflow-hidden">
      {/* Coluna Esquerda: Lista de Conversas (Esconde no mobile quando um chat está aberto) */}
      <div
        className={`w-full sm:w-80 border-r border-[#E5EBE7] flex flex-col h-full bg-[#F4F7F5]/50 ${
          selectedConvId ? 'hidden sm:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-[#E5EBE7] bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-[#163D2B] font-heading flex items-center gap-2">
              <MessageSquare size={18} className="text-[#167C49]" />
              <span>Papo Privado</span>
            </h2>

            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="p-1.5 bg-[#EAF5EE] text-[#167C49] hover:bg-[#167C49] hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              title="Nova conversa"
            >
              <Plus size={15} />
              <span>Novo</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              placeholder="Buscar pessoas ou conversas..."
              className="w-full bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl py-1.5 pl-8 pr-3 text-xs text-[#163D2B] focus:bg-white focus:outline-hidden"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#738078]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#E5EBE7]/60">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
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
                  <div className="relative shrink-0">
                    <img
                      src={
                        participant?.photoURL ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant?.username || 'user'}`
                      }
                      alt={participant?.displayName || 'Contato'}
                      className="w-11 h-11 rounded-full object-cover border border-[#167C49]/20"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#167C49] border-2 border-white rounded-full" />
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-[#163D2B] truncate font-heading">
                        {participant?.displayName || 'Brasileiro'}
                      </h4>
                      <span className="text-[10px] text-[#738078] shrink-0">
                        {formatRelativeTime(conv.updatedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#738078] truncate flex items-center gap-1">
                      {conv.lastMessageSenderId === user?.uid && (
                        <CheckCheck size={13} className="text-[#167C49] shrink-0" />
                      )}
                      <span>{conv.lastMessageText || 'Conversa iniciada'}</span>
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-[#738078]">
              <MessageSquare size={32} className="mx-auto text-[#167C49] mb-2 opacity-40" />
              <p className="font-bold text-[#163D2B]">Nenhum papo encontrado</p>
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="mt-3 text-xs font-bold text-[#167C49] hover:underline cursor-pointer"
              >
                + Começar nova conversa agora
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Coluna Direita: Conversa Ativa */}
      <div
        className={`flex-1 flex flex-col h-full bg-white ${
          !selectedConvId ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {selectedRecipient ? (
          <>
            {/* Header da conversa com botão Voltar no Mobile */}
            <div className="p-3.5 sm:p-4 border-b border-[#E5EBE7] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSelectedConvId(null)}
                  className="sm:hidden p-1.5 text-[#738078] hover:bg-[#F4F7F5] rounded-lg mr-1"
                >
                  <ArrowLeft size={18} />
                </button>

                <div className="relative shrink-0">
                  <img
                    src={
                      selectedRecipient.photoURL ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedRecipient.username}`
                    }
                    alt={selectedRecipient.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-[#167C49]/20"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#167C49] border-2 border-white rounded-full" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#163D2B] font-heading flex items-center gap-1.5">
                    <span>{selectedRecipient.displayName}</span>
                    <span className="text-[10px] text-[#167C49] font-normal bg-[#EAF5EE] px-1.5 py-0.2 rounded-full hidden sm:inline">
                      Online no Brasil
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#738078]">
                    @{selectedRecipient.username}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#167C49] font-medium bg-[#EAF5EE] px-2.5 py-1 rounded-full">
                <ShieldCheck size={14} />
                <span className="hidden sm:inline">Criptografia ativa</span>
              </div>
            </div>

            {/* Histórico de Mensagens com Indicadores de Leitura */}
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

                      {/* Indicador de horário e recibo de leitura */}
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-[#738078] px-1">
                        <span>{formatRelativeTime(msg.createdAt)}</span>
                        {isMine && (
                          <span title={msg.isRead ? 'Mensagem lida' : 'Enviada'}>
                            {msg.isRead ? (
                              <CheckCheck size={13} className="text-[#167C49] font-bold" />
                            ) : (
                              <Check size={13} className="text-gray-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-[#738078]">
                  <MessageSquare size={36} className="text-[#167C49] mb-2 opacity-40" />
                  <p className="font-bold text-[#163D2B] text-sm mb-1">
                    Inicie o papo com {selectedRecipient.displayName}!
                  </p>
                  <p className="max-w-xs">
                    Mande uma saudação ou use uma das reações rápidas abaixo para começar.
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reações rápidas brasileiras */}
            <div className="px-4 py-1.5 bg-white border-t border-[#E5EBE7]/50 flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-[10px] text-[#738078] mr-1">Rápido:</span>
              {quickReactions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendMessage(emoji)}
                  className="px-2 py-0.5 bg-[#F4F7F5] hover:bg-[#EAF5EE] rounded-lg transition-transform hover:scale-110 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Campo para digitação e envio */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 sm:p-4 border-t border-[#E5EBE7] bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Mande uma mensagem para ${selectedRecipient.displayName}... (Pressione Enter)`}
                className="flex-1 bg-[#F4F7F5] border border-[#E5EBE7] focus:border-[#167C49] focus:bg-white rounded-full py-2.5 px-4 text-xs sm:text-sm text-[#163D2B] focus:outline-hidden transition-colors"
              />
              <button
                type="submit"
                disabled={sending || !inputMessage.trim()}
                className="p-2.5 bg-[#167C49] hover:bg-[#115D38] disabled:opacity-40 text-white rounded-full transition-colors cursor-pointer shrink-0 shadow-xs"
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
            <p className="text-xs max-w-xs mb-4">
              Selecione uma conversa ao lado ou comece um novo papo com seus contatos.
            </p>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="px-4 py-2 bg-[#167C49] hover:bg-[#115D38] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Nova Conversa</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal para iniciar nova conversa */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-[#E5EBE7] shadow-2xl relative">
            <button
              onClick={() => setIsNewChatModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-[#738078] hover:bg-[#F4F7F5] rounded-full"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-[#163D2B] font-heading mb-1">
              Nova Conversa
            </h3>
            <p className="text-xs text-[#738078] mb-4">
              Escolha uma pessoa para puxar papo no Brasil:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {contactsList.map((contact) => (
                <div
                  key={contact.uid}
                  onClick={() => handleStartNewChatWith(contact)}
                  className="p-2.5 rounded-2xl hover:bg-[#EAF5EE] transition-colors flex items-center justify-between cursor-pointer border border-[#E5EBE7]/50"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={contact.photoURL}
                      alt={contact.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-[#163D2B] truncate font-heading">
                        {contact.displayName}
                      </h4>
                      <p className="text-[11px] text-[#738078] truncate">
                        @{contact.username} • {contact.city}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-[#167C49] shrink-0">
                    Conversar →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
