/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Heart,
  MessageCircle,
  Share2,
  Radio,
  Sparkles,
  Info,
  Flag,
} from 'lucide-react';
import { VideoItem } from '../../types';
import { subscribeToVideos } from '../../services/socialService';
import { useAuth } from '../../context/AuthContext';

export const VideosView: React.FC = () => {
  const { user, setIsAuthModalOpen } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [showLiveNotice, setShowLiveNotice] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const unsub = subscribeToVideos((list) => {
      setVideos(list);
    });
    return () => unsub();
  }, []);

  const currentVideo = videos[currentIndex];

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleLike = (id: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-16">
      {/* Topo do Papo Vídeos & Botão Ao Vivo */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-[#E5EBE7] shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#167C49] animate-pulse" />
          <h2 className="text-sm font-extrabold text-[#163D2B] font-heading">
            Papo Vídeos Brasil
          </h2>
        </div>

        <button
          onClick={() => setShowLiveNotice(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-xs font-bold transition-colors cursor-pointer border border-red-200"
        >
          <Radio size={14} className="animate-pulse" />
          <span>Ao Vivo</span>
        </button>
      </div>

      {/* Aviso institucional sobre Transmissões ao Vivo conforme Item 12 */}
      {showLiveNotice && (
        <div className="bg-[#EAF5EE] border border-[#167C49]/30 rounded-2xl p-4 text-xs text-[#163D2B] relative">
          <button
            onClick={() => setShowLiveNotice(false)}
            className="absolute top-2 right-2 text-[#738078] hover:text-[#163D2B]"
          >
            ✕
          </button>
          <div className="flex items-center gap-2 font-bold text-[#115D38] mb-1">
            <Info size={16} />
            <span>Módulo de Streaming Ao Vivo (WebRTC / RTMP)</span>
          </div>
          <p className="text-[11px] text-[#738078] leading-relaxed">
            As transmissões ao vivo do PapoBR utilizam infraestrutura especializada de entrega CDN para não sobrecarregar o Firestore com pacotes de streaming contínuo. Em breve liberaremos as salas de transmissão pública para criadores brasileiros!
          </p>
        </div>
      )}

      {/* Player de Vídeo Vertical Estilo Reels */}
      {currentVideo ? (
        <div className="relative aspect-9/16 bg-black rounded-3xl overflow-hidden shadow-xl border border-gray-900 group select-none">
          <video
            ref={videoRef}
            src={currentVideo.videoUrl}
            loop
            autoPlay
            playsInline
            onClick={handleTogglePlay}
            className="w-full h-full object-cover cursor-pointer"
          />

          {/* Overlay de Pausa */}
          {!isPlaying && (
            <div
              onClick={handleTogglePlay}
              className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer backdrop-blur-2xs"
            >
              <div className="p-4 bg-white/20 rounded-full text-white backdrop-blur-sm">
                <Play size={40} className="fill-white translate-x-0.5" />
              </div>
            </div>
          )}

          {/* Botões laterais de interação */}
          <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-20">
            {/* Curtida */}
            <button
              onClick={() => handleLike(currentVideo.id)}
              className="flex flex-col items-center gap-1 group/btn"
            >
              <div
                className={`p-3 rounded-full backdrop-blur-md transition-transform active:scale-90 ${
                  likedMap[currentVideo.id]
                    ? 'bg-red-500/80 text-white'
                    : 'bg-black/40 text-white hover:bg-black/60'
                }`}
              >
                <Heart
                  size={22}
                  className={likedMap[currentVideo.id] ? 'fill-white' : ''}
                />
              </div>
              <span className="text-[11px] text-white font-bold drop-shadow-md">
                {(currentVideo.likesCount || 0) + (likedMap[currentVideo.id] ? 1 : 0)}
              </span>
            </button>

            {/* Comentários */}
            <button
              onClick={() => {
                if (!user) setIsAuthModalOpen(true);
                else alert('Comentários de vídeo em tempo real ativados!');
              }}
              className="flex flex-col items-center gap-1"
            >
              <div className="p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md">
                <MessageCircle size={22} />
              </div>
              <span className="text-[11px] text-white font-bold drop-shadow-md">
                {currentVideo.commentsCount || 0}
              </span>
            </button>

            {/* Compartilhar */}
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert('Link do vídeo copiado!');
              }}
              className="flex flex-col items-center gap-1"
            >
              <div className="p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md">
                <Share2 size={20} />
              </div>
              <span className="text-[11px] text-white font-bold drop-shadow-md">Papo</span>
            </button>

            {/* Denúncia de Conteúdo */}
            <button
              onClick={() => alert('Vídeo enviado para avaliação dos moderadores do PapoBR.')}
              className="p-2.5 bg-black/30 hover:bg-black/50 text-white/70 rounded-full"
              title="Denunciar Conteúdo"
            >
              <Flag size={14} />
            </button>
          </div>

          {/* Legenda e Autor no Rodapé */}
          <div className="absolute left-0 right-16 bottom-0 p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white z-10 pointer-events-none">
            <div className="flex items-center gap-2 mb-2 pointer-events-auto">
              <img
                src={
                  currentVideo.authorPhotoURL ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentVideo.authorUsername}`
                }
                alt={currentVideo.authorName}
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
              />
              <div>
                <h4 className="text-xs sm:text-sm font-bold font-heading drop-shadow-sm">
                  {currentVideo.authorName}
                </h4>
                <p className="text-[11px] text-[#F3C84B] font-medium">
                  @{currentVideo.authorUsername}
                </p>
              </div>
            </div>

            <p className="text-xs line-clamp-2 drop-shadow-md mb-2">
              {currentVideo.title} • {currentVideo.description}
            </p>

            {currentVideo.tags && (
              <div className="flex flex-wrap gap-1">
                {currentVideo.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 bg-white rounded-3xl border border-[#E5EBE7] text-center text-xs text-[#738078]">
          Carregando vídeos curtos do Brasil...
        </div>
      )}

      {/* Controles de navegação de vídeos */}
      <div className="flex items-center justify-between px-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="text-xs font-bold text-[#167C49] disabled:opacity-30 hover:underline cursor-pointer"
        >
          ↑ Vídeo anterior
        </button>
        <span className="text-xs text-[#738078]">
          {currentIndex + 1} de {videos.length}
        </span>
        <button
          onClick={handleNext}
          disabled={currentIndex === videos.length - 1}
          className="text-xs font-bold text-[#167C49] disabled:opacity-30 hover:underline cursor-pointer"
        >
          ↓ Próximo vídeo
        </button>
      </div>
    </div>
  );
};
