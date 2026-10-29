/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { NotificationItem } from '../../types';
import {
  subscribeToNotifications,
  markNotificationAsRead,
} from '../../services/socialService';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime } from '../../lib/utils';

export const NotificationsView: React.FC = () => {
  const { user, setIsAuthModalOpen } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.uid, (list) => {
      setNotifications(list);
    });
    return () => unsub();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    for (const notif of notifications) {
      if (!notif.isRead) {
        await markNotificationAsRead(notif.id);
      }
    }
  };

  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.isRead : true));
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!user) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center max-w-lg mx-auto border border-[#E5EBE7] shadow-xs">
        <Bell size={40} className="mx-auto text-[#167C49] mb-3 opacity-60" />
        <h2 className="text-xl font-bold text-[#163D2B] font-heading mb-2">
          Suas Notificações no PapoBR
        </h2>
        <p className="text-xs text-[#738078] mb-5">
          Faça login para acompanhar quem curtiu, comentou e se conectou com você.
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="bg-[#167C49] hover:bg-[#115D38] text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-xs transition-colors cursor-pointer"
        >
          Entrar na Conta
        </button>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={16} className="text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageCircle size={16} className="text-[#167C49] fill-[#167C49]" />;
      case 'friend_request':
      case 'friend_accept':
        return <UserPlus size={16} className="text-[#167C49]" />;
      default:
        return <Sparkles size={16} className="text-[#F3C84B]" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5EBE7] shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5EBE7]">
          <div>
            <h1 className="text-xl font-extrabold text-[#163D2B] font-heading flex items-center gap-2">
              <Bell size={22} className="text-[#167C49]" />
              <span>Notificações</span>
            </h1>
            <p className="text-xs text-[#738078] mt-0.5">
              Fique por dentro de tudo o que acontece no seu papo.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs font-bold text-[#167C49] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck size={16} />
              <span>Marcar todas como lidas</span>
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex bg-[#F4F7F5] p-1 rounded-2xl mt-4">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-[#167C49] shadow-xs'
                : 'text-[#738078] hover:text-[#163D2B]'
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filter === 'unread'
                ? 'bg-white text-[#167C49] shadow-xs'
                : 'text-[#738078] hover:text-[#163D2B]'
            }`}
          >
            Não Lidas ({unreadCount})
          </button>
        </div>
      </div>

      {/* Lista de Notificações */}
      {filtered.length > 0 ? (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkAsRead(item.id)}
              className={`p-4 rounded-2xl border transition-colors flex items-start gap-3.5 cursor-pointer ${
                item.isRead
                  ? 'bg-white border-[#E5EBE7] text-[#163D2B]'
                  : 'bg-[#EAF5EE]/70 border-[#167C49]/20 text-[#163D2B] font-medium'
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={
                    item.actorPhotoURL ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.actorId}`
                  }
                  alt={item.actorName}
                  className="w-11 h-11 rounded-full object-cover border border-[#167C49]/20"
                />
                <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-xs">
                  {getIcon(item.type)}
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <p className="text-xs sm:text-sm leading-relaxed">
                  {item.message}
                </p>
                <span className="text-[11px] text-[#738078] flex items-center gap-1 mt-1">
                  <Clock size={12} />
                  {formatRelativeTime(item.createdAt)}
                </span>
              </div>

              {!item.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#167C49] shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center border border-[#E5EBE7]">
          <p className="text-xs text-[#738078]">
            {filter === 'unread'
              ? 'Você não tem notificações não lidas!'
              : 'Nenhuma notificação por enquanto.'}
          </p>
        </div>
      )}
    </div>
  );
};
