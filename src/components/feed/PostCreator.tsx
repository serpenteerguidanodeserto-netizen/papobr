/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  MapPin,
  Tag,
  X,
  Send,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createNewPost } from '../../services/postsService';
import { compressImage } from '../../lib/utils';

interface PostCreatorProps {
  onPostCreated?: () => void;
  communityId?: string;
  communityName?: string;
}

export const PostCreator: React.FC<PostCreatorProps> = ({
  onPostCreated,
  communityId,
  communityName,
}) => {
  const { user, profile, setIsAuthModalOpen, signInAsDemoUser } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState(
    profile?.city && profile?.state ? `${profile.city}, ${profile.state}` : 'Brasil'
  );
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showSamplePhotos, setShowSamplePhotos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestedTags = ['Brasil', 'CulináriaBR', 'Tecnologia', 'Cultura', 'Resenha', 'Música'];

  const samplePhotos = [
    { label: 'Rio de Janeiro', url: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=80' },
    { label: 'Bahia (Pelourinho)', url: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?auto=format&fit=crop&w=800&q=80' },
    { label: 'Cataratas do Iguaçu', url: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=800&q=80' },
    { label: 'São Paulo', url: 'https://images.unsplash.com/photo-1543059509-6d53c2412162?auto=format&fit=crop&w=800&q=80' },
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setLoading(true);
      const newImages: string[] = [];
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        const compressed = await compressImage(files[i], 800, 0.65);
        newImages.push(compressed);
      }
      setImages((prev) => [...prev, ...newImages].slice(0, 4));
    } catch (err) {
      console.error('Falha ao processar imagem:', err);
      setFeedback({ type: 'error', text: 'Não foi possível carregar a imagem. Tente uma foto menor.' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // If not logged in, auto-login with 1 click to unblock the user immediately
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

    if (!content.trim() && images.length === 0) {
      setFeedback({ type: 'error', text: 'Escreva uma mensagem ou adicione uma foto para publicar.' });
      return;
    }

    try {
      setLoading(true);
      const tagsList = selectedTag ? [selectedTag] : [];
      await createNewPost(currentProfile, {
        content: content.trim(),
        imageUrls: images,
        location: location.trim(),
        communityId,
        communityName,
        tags: tagsList,
      });

      setContent('');
      setImages([]);
      setSelectedTag(null);
      setFeedback({ type: 'success', text: '🎉 Publicação compartilhada com sucesso no PapoBR!' });
      setTimeout(() => setFeedback(null), 4000);
      if (onPostCreated) onPostCreated();
    } catch (err) {
      console.error('Erro ao publicar:', err);
      setFeedback({ type: 'error', text: 'Ocorreu um erro ao publicar. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EBE7] shadow-xs transition-shadow hover:shadow-md">
      {/* Notificação de Feedback */}
      {feedback && (
        <div
          className={`mb-3.5 p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-[#EAF5EE] text-[#115D38] border border-[#167C49]/20'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dica para visitantes não conectados */}
      {!user && (
        <div className="mb-3 p-2.5 bg-[#EAF5EE] rounded-xl flex items-center justify-between text-xs border border-[#167C49]/20">
          <span className="text-[#163D2B] font-medium">
            Você está navegando como visitante.
          </span>
          <button
            type="button"
            onClick={() => signInAsDemoUser('Carlos Eduardo (PapoBR)', 'carloseduardo_br')}
            className="text-[#167C49] font-bold hover:underline flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg shadow-2xs border border-[#167C49]/15"
          >
            <Sparkles size={12} className="text-[#F3C84B]" />
            <span>Conectar em 1 clique</span>
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <img
          src={
            profile?.photoURL ||
            (user
              ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`
              : 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest')
          }
          alt={profile?.displayName || 'Você'}
          className="w-11 h-11 rounded-full object-cover border-2 border-[#167C49]/30 shrink-0"
        />

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              communityName
                ? `Compartilhe algo na comunidade ${communityName}...`
                : user
                ? `O que você está pensando, ${profile?.displayName?.split(' ')[0] || 'amigo'}?`
                : 'O que você está pensando no PapoBR? Escreva e publique...'
            }
            rows={content.length > 80 ? 4 : 2}
            className="w-full text-sm text-[#163D2B] placeholder-[#738078] bg-[#F4F7F5] focus:bg-white border border-[#E5EBE7] focus:border-[#167C49] rounded-2xl p-3.5 focus:outline-hidden focus:ring-2 focus:ring-[#167C49]/10 resize-none transition-all"
          />

          {/* Pré-visualização de imagens anexadas */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video bg-gray-100">
                  <img src={img} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Seletor rápido de Fotos Modelo do Brasil */}
          {showSamplePhotos && (
            <div className="mt-3 p-3 bg-[#F4F7F5] rounded-xl border border-[#E5EBE7]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#163D2B]">
                  Fotos prontas para testar publicação:
                </span>
                <button
                  type="button"
                  onClick={() => setShowSamplePhotos(false)}
                  className="text-[11px] text-[#738078] hover:text-[#163D2B]"
                >
                  Fechar
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {samplePhotos.map((photo) => (
                  <button
                    key={photo.label}
                    type="button"
                    onClick={() => {
                      if (!images.includes(photo.url) && images.length < 4) {
                        setImages((prev) => [...prev, photo.url]);
                      }
                      setShowSamplePhotos(false);
                    }}
                    className="text-left bg-white p-1 rounded-lg border border-[#E5EBE7] hover:border-[#167C49] transition-all cursor-pointer group"
                  >
                    <img
                      src={photo.url}
                      alt={photo.label}
                      className="w-full h-14 object-cover rounded-md mb-1"
                    />
                    <p className="text-[10px] font-semibold text-[#163D2B] truncate px-0.5">
                      {photo.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags sugeridas brasileiras */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-[11px] font-bold text-[#738078] flex items-center gap-1 mr-1">
              <Tag size={12} className="text-[#167C49]" />
              Tags:
            </span>
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-[#167C49] text-white'
                    : 'bg-[#F4F7F5] text-[#163D2B] hover:bg-[#EAF5EE] hover:text-[#167C49]'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Seletor de localização expansível */}
          {showLocationPicker && (
            <div className="flex items-center gap-2 mt-3 p-2 bg-[#EAF5EE] rounded-xl text-xs">
              <MapPin size={15} className="text-[#167C49] shrink-0" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Salvador, BA ou São Paulo, SP"
                className="flex-1 bg-white border border-[#E5EBE7] px-2.5 py-1 rounded-lg text-[#163D2B] text-xs focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowLocationPicker(false)}
                className="text-[11px] font-bold text-[#167C49] hover:underline"
              >
                Ok
              </button>
            </div>
          )}

          {/* Barra de Ações Inferior */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E5EBE7]">
            <div className="flex items-center gap-1 flex-wrap">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-[#167C49] hover:bg-[#EAF5EE] rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
                title="Carregar Foto do Aparelho"
              >
                <ImageIcon size={18} />
                <span className="hidden sm:inline">Foto</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSamplePhotos(!showSamplePhotos)}
                className="p-2 text-[#738078] hover:text-[#167C49] hover:bg-[#EAF5EE] rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
                title="Escolher Foto Pronta"
              >
                <Sparkles size={16} className="text-[#F3C84B]" />
                <span className="hidden sm:inline">Fotos BR</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className="p-2 text-[#738078] hover:text-[#167C49] hover:bg-[#EAF5EE] rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
                title="Marcar Localização"
              >
                <MapPin size={18} />
                <span className="hidden sm:inline">{location || 'Local'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || (!content.trim() && images.length === 0)}
              className="bg-[#167C49] hover:bg-[#115D38] disabled:opacity-50 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Publicar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
