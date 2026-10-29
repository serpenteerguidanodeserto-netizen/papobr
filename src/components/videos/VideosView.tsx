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
  Volume2,
  VolumeX,
  Plus,
  X,
  Upload,
  Send,
  Camera,
  Video as VideoIcon,
  Mic,
  MicOff,
  Settings,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { VideoItem } from '../../types';
import {
  subscribeToVideos,
  createVideoPost,
  submitReport,
} from '../../services/socialService';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime } from '../../lib/utils';

export const VideosView: React.FC = () => {
  const { user, profile, setIsAuthModalOpen, signInAsDemoUser } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [videoFeedback, setVideoFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modais
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLiveStudio, setShowLiveStudio] = useState(false);

  // Comentários do vídeo atual
  const [videoComments, setVideoComments] = useState<{ id: string; authorName: string; text: string; time: string }[]>([
    { id: '1', authorName: 'Juliana Paes (BH)', text: 'Que lugar espetacular do nosso Brasil! 🇧🇷👏', time: 'há 10 min' },
    { id: '2', authorName: 'Bruno Alencar', text: 'Já adicionei no meu roteiro de férias!', time: 'há 25 min' },
  ]);
  const [newCommentInput, setNewCommentInput] = useState('');

  // Upload Form
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoTags, setVideoTags] = useState('Brasil, Cultura, Viagem');
  const [uploading, setUploading] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);

  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const sampleClips = [
    {
      title: 'Cataratas do Iguaçu em dia de Sol 🌈',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4',
      tag: 'Paraná',
    },
    {
      title: 'Cozinha Brasileira & Sabores Típicos 🥘',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-cooking-a-delicious-meal-in-a-pan-43407-large.mp4',
      tag: 'CulináriaBR',
    },
    {
      title: 'Noite Iluminada em São Paulo 🏙️',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-42289-large.mp4',
      tag: 'SãoPaulo',
    },
    {
      title: 'Paz e Natureza no Interior 🍃',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4',
      tag: 'BrasilVerde',
    },
  ];

  // Live Studio States (WebRTC camera preview)
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  // Denúncia Form
  const [reportReason, setReportReason] = useState('Conteúdo Impróprio');
  const [reportSuccess, setReportSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);

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

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 1;
    setProgress((current / duration) * 100);
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showUploadModal || showCommentsDrawer || showLiveStudio || showReportModal) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length, isPlaying, showUploadModal, showCommentsDrawer, showLiveStudio]);

  // Publicar novo vídeo
  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoFeedback(null);

    let currentProfile = profile;
    if (!user || !currentProfile) {
      await signInAsDemoUser('Carlos Eduardo (PapoBR)', 'carloseduardo_br');
      currentProfile = {
        uid: 'user_carloseduardo_br',
        displayName: 'Carlos Eduardo (PapoBR)',
        username: 'carloseduardo_br',
        email: 'carloseduardo_br@papobr.com.br',
        city: 'Rio de Janeiro',
        state: 'RJ',
        createdAt: new Date().toISOString(),
      };
    }

    let finalUrl = videoUrlInput.trim();
    if (!finalUrl && selectedVideoFile) {
      finalUrl = URL.createObjectURL(selectedVideoFile);
    }
    if (!finalUrl) {
      finalUrl = 'https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4';
    }

    try {
      setUploading(true);
      const tagsArray = videoTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const title = videoTitle.trim() || 'Momento Brasileiro no PapoBR 🇧🇷';

      const newId = await createVideoPost(currentProfile, {
        title,
        description: videoDesc.trim(),
        videoUrl: finalUrl,
        tags: tagsArray.length > 0 ? tagsArray : ['Brasil', 'PapoBR'],
      });

      const newVideoItem: VideoItem = {
        id: newId,
        authorId: currentProfile.uid,
        authorName: currentProfile.displayName,
        authorUsername: currentProfile.username,
        authorPhotoURL: currentProfile.photoURL,
        title,
        description: videoDesc.trim(),
        videoUrl: finalUrl,
        likesCount: 0,
        commentsCount: 0,
        tags: tagsArray.length > 0 ? tagsArray : ['Brasil', 'PapoBR'],
        createdAt: new Date().toISOString(),
      };

      setVideos((prev) => [newVideoItem, ...prev]);
      setCurrentIndex(0);
      setShowUploadModal(false);
      setVideoTitle('');
      setVideoDesc('');
      setVideoUrlInput('');
      setSelectedVideoFile(null);
      setVideoFeedback({ type: 'success', text: '🎉 Vídeo publicado com sucesso no PapoBR!' });
      setTimeout(() => setVideoFeedback(null), 4000);
    } catch (err) {
      console.error('Erro ao postar vídeo:', err);
      setVideoFeedback({ type: 'error', text: 'Não foi possível publicar o vídeo. Tente novamente.' });
    } finally {
      setUploading(false);
    }
  };

  // Adicionar comentário no vídeo
  const handleAddVideoComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!newCommentInput.trim()) return;

    setVideoComments((prev) => [
      {
        id: Date.now().toString(),
        authorName: profile.displayName,
        text: newCommentInput.trim(),
        time: 'agora mesmo',
      },
      ...prev,
    ]);
    setNewCommentInput('');
  };

  // Enviar denúncia
  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVideo) return;
    await submitReport(user?.uid || 'anon', 'video', currentVideo.id, reportReason);
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setShowReportModal(false);
    }, 2000);
  };

  // WebRTC Live Camera Start
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Câmera não disponível no dispositivo:', err);
      alert('Não foi possível acessar a câmera ou permissão negada. O estúdio ainda exibe as configurações de streaming RTMP.');
    }
  };

  const stopCamera = () => {
    if (liveVideoRef.current && liveVideoRef.current.srcObject) {
      const stream = liveVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      liveVideoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-16">
      {/* Feedback de publicação */}
      {videoFeedback && (
        <div
          className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            videoFeedback.type === 'success'
              ? 'bg-[#EAF5EE] text-[#115D38] border border-[#167C49]/20'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <span>{videoFeedback.text}</span>
          <button
            type="button"
            onClick={() => setVideoFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Topo do Papo Vídeos com botão Publicar e Ao Vivo */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-[#E5EBE7] shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#167C49] animate-pulse" />
          <h2 className="text-sm font-extrabold text-[#163D2B] font-heading">
            Papo Vídeos Brasil
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#EAF5EE] hover:bg-[#167C49] hover:text-white text-[#167C49] rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Postar Vídeo</span>
          </button>

          <button
            onClick={() => {
              setShowLiveStudio(true);
              startCamera();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-red-200"
          >
            <Radio size={14} className="animate-pulse" />
            <span>Ao Vivo</span>
          </button>
        </div>
      </div>

      {/* Player de Vídeo Vertical Estilo Reels */}
      {currentVideo ? (
        <div className="relative aspect-9/16 bg-black rounded-3xl overflow-hidden shadow-xl border border-gray-900 group select-none">
          <video
            ref={videoRef}
            src={currentVideo.videoUrl}
            loop
            autoPlay
            playsInline
            muted={isMuted}
            onClick={handleTogglePlay}
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-cover cursor-pointer"
          />

          {/* Barra de Progresso Superior */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20">
            <div
              className="h-full bg-[#F3C84B] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Botão de Som Mute/Unmute no Canto Superior Direito */}
          <button
            onClick={handleToggleMute}
            className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full z-20 backdrop-blur-md cursor-pointer transition-colors"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Overlay de Pausa */}
          {!isPlaying && (
            <div
              onClick={handleTogglePlay}
              className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer backdrop-blur-2xs z-10"
            >
              <div className="p-4 bg-white/20 rounded-full text-white backdrop-blur-sm">
                <Play size={40} className="fill-white translate-x-0.5" />
              </div>
            </div>
          )}

          {/* Botões laterais de interação estilo TikTok/Reels */}
          <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-20">
            {/* Curtida */}
            <button
              onClick={() => handleLike(currentVideo.id)}
              className="flex flex-col items-center gap-1 group/btn cursor-pointer"
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
              onClick={() => setShowCommentsDrawer(true)}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <div className="p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md">
                <MessageCircle size={22} />
              </div>
              <span className="text-[11px] text-white font-bold drop-shadow-md">
                {videoComments.length}
              </span>
            </button>

            {/* Compartilhar */}
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert('Link do vídeo copiado para a área de transferência!');
              }}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <div className="p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md">
                <Share2 size={20} />
              </div>
              <span className="text-[11px] text-white font-bold drop-shadow-md">Papo</span>
            </button>

            {/* Denúncia de Conteúdo */}
            <button
              onClick={() => setShowReportModal(true)}
              className="p-2.5 bg-black/30 hover:bg-black/50 text-white/70 rounded-full cursor-pointer"
              title="Denunciar Conteúdo"
            >
              <Flag size={14} />
            </button>
          </div>

          {/* Legenda e Autor no Rodapé */}
          <div className="absolute left-0 right-16 bottom-0 p-5 bg-gradient-to-t from-black/95 via-black/50 to-transparent text-white z-10 pointer-events-none">
            <div className="flex items-center gap-2.5 mb-2 pointer-events-auto">
              <img
                src={
                  currentVideo.authorPhotoURL ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentVideo.authorUsername}`
                }
                alt={currentVideo.authorName}
                className="w-10 h-10 rounded-full border-2 border-[#167C49] object-cover"
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

            <p className="text-xs line-clamp-2 drop-shadow-md mb-2 pointer-events-auto">
              {currentVideo.title} {currentVideo.description ? `• ${currentVideo.description}` : ''}
            </p>

            {currentVideo.tags && (
              <div className="flex flex-wrap gap-1 pointer-events-auto">
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

      {/* Controles de Navegação Verticais */}
      <div className="flex items-center justify-between px-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="text-xs font-bold text-[#167C49] disabled:opacity-30 hover:underline cursor-pointer"
        >
          ↑ Vídeo anterior
        </button>
        <span className="text-xs text-[#738078]">
          {currentIndex + 1} de {videos.length} (Use setas ↑ / ↓)
        </span>
        <button
          onClick={handleNext}
          disabled={currentIndex === videos.length - 1}
          className="text-xs font-bold text-[#167C49] disabled:opacity-30 hover:underline cursor-pointer"
        >
          ↓ Próximo vídeo
        </button>
      </div>

      {/* MODAL 1: Publicar Novo Vídeo Curto */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#E5EBE7] shadow-2xl relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-5 right-5 p-1.5 text-[#738078] hover:bg-[#F4F7F5] rounded-full"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-[#163D2B] font-heading mb-3 flex items-center gap-2">
              <Upload size={20} className="text-[#167C49]" />
              <span>Postar no Papo Vídeos</span>
            </h3>

            <form onSubmit={handleCreateVideo} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#163D2B] mb-1">
                  Título do Vídeo
                </label>
                <input
                  type="text"
                  required
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Ex: Pôr do sol no Arpoador 🌅"
                  className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#163D2B] mb-1.5">
                  Vídeo (Escolha uma das 3 opções abaixo)
                </label>

                {/* Opção 1: Selecionar arquivo do dispositivo */}
                <input
                  type="file"
                  ref={videoFileInputRef}
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedVideoFile(file);
                      if (!videoTitle) setVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  className="hidden"
                />

                <div className="mb-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 bg-white border border-[#167C49] text-[#167C49] hover:bg-[#EAF5EE] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Upload size={14} />
                    <span>
                      {selectedVideoFile ? `Selecionado: ${selectedVideoFile.name.slice(0, 20)}...` : '📁 Carregar Arquivo do Aparelho'}
                    </span>
                  </button>
                  {selectedVideoFile && (
                    <button
                      type="button"
                      onClick={() => setSelectedVideoFile(null)}
                      className="text-xs text-red-500 font-bold px-2"
                    >
                      Remover
                    </button>
                  )}
                </div>

                {/* Opção 2: Clipes Prontos do Brasil */}
                <div className="mb-2 p-2.5 bg-[#EAF5EE] rounded-xl border border-[#167C49]/20">
                  <p className="text-[11px] font-bold text-[#167C49] mb-1.5 flex items-center gap-1">
                    <Sparkles size={12} className="text-[#F3C84B]" />
                    Ou clique para testar com um clipe modelo brasileiro:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {sampleClips.map((clip) => (
                      <button
                        key={clip.title}
                        type="button"
                        onClick={() => {
                          setVideoUrlInput(clip.url);
                          setVideoTitle(clip.title);
                          setVideoTags(`Brasil, ${clip.tag}, Viagem`);
                          setSelectedVideoFile(null);
                        }}
                        className={`p-1.5 bg-white text-[10px] text-left rounded-lg border transition-all cursor-pointer truncate ${
                          videoUrlInput === clip.url
                            ? 'border-[#167C49] bg-emerald-50 text-[#167C49] font-bold'
                            : 'border-[#E5EBE7] text-[#163D2B] hover:border-[#167C49]'
                        }`}
                      >
                        {clip.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opção 3: URL manual */}
                <input
                  type="url"
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="Ou cole a URL direta de um vídeo MP4/WebM"
                  className="w-full px-3 py-1.5 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-xs text-[#163D2B] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#163D2B] mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={videoDesc}
                  onChange={(e) => setVideoDesc(e.target.value)}
                  placeholder="Diga mais sobre esse momento brasileiro..."
                  className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-xs text-[#163D2B] focus:bg-white focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#163D2B] mb-1">
                  Hashtags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={videoTags}
                  onChange={(e) => setVideoTags(e.target.value)}
                  placeholder="Brasil, Viagem, RioDeJaneiro"
                  className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-xs text-[#163D2B] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5EBE7]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#738078] hover:bg-[#F4F7F5] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-[#167C49] hover:bg-[#115D38] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  <span>Publicar Vídeo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Gaveta de Comentários do Vídeo */}
      {showCommentsDrawer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[80vh] flex flex-col border border-[#E5EBE7] shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EBE7]">
              <h3 className="text-sm font-bold text-[#163D2B] font-heading flex items-center gap-2">
                <MessageCircle size={18} className="text-[#167C49]" />
                <span>Comentários ({videoComments.length})</span>
              </h3>
              <button
                onClick={() => setShowCommentsDrawer(false)}
                className="p-1 text-[#738078] hover:bg-[#F4F7F5] rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {videoComments.map((c) => (
                <div key={c.id} className="p-2.5 bg-[#F4F7F5] rounded-2xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-[#163D2B]">
                    <span>{c.authorName}</span>
                    <span className="text-[10px] text-[#738078] font-normal">{c.time}</span>
                  </div>
                  <p className="text-[#163D2B]">{c.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddVideoComment} className="pt-2 border-t border-[#E5EBE7] flex items-center gap-2">
              <input
                type="text"
                value={newCommentInput}
                onChange={(e) => setNewCommentInput(e.target.value)}
                placeholder="Comente neste vídeo..."
                className="flex-1 bg-[#F4F7F5] border border-[#E5EBE7] focus:border-[#167C49] rounded-full px-3.5 py-2 text-xs text-[#163D2B] focus:outline-hidden"
              />
              <button
                type="submit"
                className="p-2 bg-[#167C49] hover:bg-[#115D38] text-white rounded-full transition-colors cursor-pointer"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PapoBR Live Studio (Streaming Architecture & Camera) */}
      {showLiveStudio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-[#E5EBE7] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                stopCamera();
                setShowLiveStudio(false);
              }}
              className="absolute top-5 right-5 p-1.5 text-[#738078] hover:bg-[#F4F7F5] rounded-full"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
              <h3 className="text-lg font-bold text-[#163D2B] font-heading">
                PapoBR Live Studio (Transmissões ao Vivo)
              </h3>
            </div>

            {/* Tela de visualização da Câmera (WebRTC) */}
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-4 border border-gray-800 flex items-center justify-center">
              <video
                ref={liveVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />
              {!cameraActive && (
                <div className="text-center p-6 text-white/70 text-xs space-y-2">
                  <Camera size={36} className="mx-auto text-white/40 mb-1" />
                  <p className="font-bold text-white">Pré-visualização da Câmera</p>
                  <button
                    onClick={startCamera}
                    className="px-3.5 py-1.5 bg-[#167C49] text-white rounded-xl font-bold hover:bg-[#115D38] cursor-pointer"
                  >
                    Ativar Câmera Local
                  </button>
                </div>
              )}
            </div>

            {/* Painel da Arquitetura de Streaming (Item 12 da especificação) */}
            <div className="bg-[#EAF5EE] border border-[#167C49]/20 rounded-2xl p-4 text-xs space-y-2.5 mb-4">
              <div className="flex items-center gap-2 font-bold text-[#115D38]">
                <Info size={16} />
                <span>Arquitetura de Streaming Especializada</span>
              </div>
              <p className="text-[12px] text-[#163D2B] leading-relaxed">
                Conforme as boas práticas da plataforma, fluxos de vídeo ao vivo de alta resolução utilizam protocolos **RTMP / HLS / WebRTC** com distribuição por CDN dedicada (Mux / AWS IVS / Cloudflare Stream), sem sobrecarregar o Cloud Firestore com pacotes de vídeo.
              </p>

              <div className="p-2.5 bg-white rounded-xl border border-[#E5EBE7] space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-[#738078]">Servidor RTMP:</span>
                  <span className="text-[#163D2B] font-bold">rtmp://live.papobr.com.br/app</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#738078]">Chave de Stream:</span>
                  <span className="text-[#167C49] font-bold">papo_live_8f5a12b</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  stopCamera();
                  setShowLiveStudio(false);
                }}
                className="px-4 py-2 bg-[#167C49] text-white text-xs font-bold rounded-xl"
              >
                Concluir & Fechar Estúdio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Denúncia de Conteúdo */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-[#E5EBE7] shadow-2xl relative">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[#738078] hover:bg-[#F4F7F5] rounded-full"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-[#163D2B] font-heading mb-2 flex items-center gap-1.5">
              <Flag size={18} className="text-red-500" />
              <span>Denunciar este Vídeo</span>
            </h3>

            {reportSuccess ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-xs text-green-700 text-center">
                Denúncia recebida com sucesso. A equipe do PapoBR analisará o conteúdo.
              </div>
            ) : (
              <form onSubmit={handleSendReport} className="space-y-3">
                <p className="text-xs text-[#738078]">
                  Selecione o motivo da denúncia para avaliação da nossa moderação:
                </p>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-xs text-[#163D2B] focus:outline-hidden"
                >
                  <option value="Conteúdo Impróprio">Conteúdo Impróprio / Ofensivo</option>
                  <option value="Spam ou Fraude">Spam ou Fraude</option>
                  <option value="Discurso de Ódio">Discurso de Ódio ou Assédio</option>
                  <option value="Violação de Direitos">Violação de Direitos Autorais</option>
                  <option value="Desinformação">Desinformação prejudicial</option>
                </select>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3 py-1.5 text-xs text-[#738078] hover:bg-[#F4F7F5] rounded-xl font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl"
                  >
                    Enviar Denúncia
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
