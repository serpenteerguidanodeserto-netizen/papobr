/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Edit3,
  Camera,
  Users,
  FileText,
  Check,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, Post } from '../../types';
import { PostCard } from '../feed/PostCard';
import { subscribeToPosts } from '../../services/postsService';
import { ESTADOS_BRASIL, formatRelativeTime, compressImage } from '../../lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ProfileViewProps {
  targetUserId?: string;
  onBackToFeed?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  targetUserId,
}) => {
  const { user, profile: myProfile, updateProfileData, setIsAuthModalOpen } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'friends'>('posts');
  const [isEditing, setIsEditing] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [editCoverURL, setEditCoverURL] = useState('');
  const [saving, setSaving] = useState(false);

  const effectiveUserId = targetUserId || user?.uid;
  const isOwnProfile = user && user.uid === effectiveUserId;

  useEffect(() => {
    async function loadProfile() {
      if (!effectiveUserId) {
        setLoadingProfile(false);
        return;
      }
      try {
        if (isOwnProfile && myProfile) {
          setProfile(myProfile);
          setEditName(myProfile.displayName);
          setEditBio(myProfile.bio || '');
          setEditCity(myProfile.city || '');
          setEditState(myProfile.state || 'SP');
          setEditPhotoURL(myProfile.photoURL || '');
          setEditCoverURL(myProfile.coverURL || '');
        } else {
          const snap = await getDoc(doc(db, 'users', effectiveUserId));
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, [effectiveUserId, isOwnProfile, myProfile]);

  // Load posts by this user
  useEffect(() => {
    if (!effectiveUserId) return;
    const unsub = subscribeToPosts((allPosts) => {
      const userPosts = allPosts.filter((p) => p.authorId === effectiveUserId);
      setPosts(userPosts);
    });
    return () => unsub();
  }, [effectiveUserId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    try {
      setSaving(true);
      await updateProfileData({
        displayName: editName.trim(),
        bio: editBio.trim(),
        city: editCity.trim(),
        state: editState,
        photoURL: editPhotoURL,
        coverURL: editCoverURL,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 400, 0.8);
      setEditPhotoURL(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 1200, 0.7);
      setEditCoverURL(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user && !targetUserId) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center max-w-lg mx-auto border border-[#E5EBE7] shadow-xs">
        <Sparkles size={40} className="mx-auto text-[#167C49] mb-3" />
        <h2 className="text-xl font-extrabold text-[#163D2B] font-heading mb-2">
          Acesse seu Perfil no PapoBR
        </h2>
        <p className="text-xs text-[#738078] mb-5">
          Crie seu perfil ou faça login para personalizar sua presença, ver suas publicações e conexões.
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="bg-[#167C49] hover:bg-[#115D38] text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-xs transition-colors cursor-pointer"
        >
          Entrar ou Cadastrar
        </button>
      </div>
    );
  }

  if (loadingProfile) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center max-w-2xl mx-auto border border-[#E5EBE7] animate-pulse">
        <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="w-40 h-4 bg-gray-200 rounded-sm mx-auto mb-2" />
        <div className="w-24 h-3 bg-gray-200 rounded-sm mx-auto" />
      </div>
    );
  }

  const currentProf = isOwnProfile ? myProfile || profile : profile;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      {/* Card Principal do Perfil */}
      <div className="bg-white rounded-3xl overflow-hidden border border-[#E5EBE7] shadow-xs">
        {/* Foto de Capa */}
        <div className="relative h-44 sm:h-52 bg-gradient-to-r from-[#115D38] to-[#167C49]">
          <img
            src={
              currentProf?.coverURL ||
              'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1200&q=80'
            }
            alt="Capa"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Informações de Perfil */}
        <div className="px-5 sm:px-6 pb-6 relative">
          <div className="flex justify-between items-end -mt-16 sm:-mt-20 mb-4">
            <div className="relative">
              <img
                src={
                  currentProf?.photoURL ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentProf?.username || 'usuario'}`
                }
                alt={currentProf?.displayName}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md bg-white"
              />
            </div>

            {isOwnProfile && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white hover:bg-[#EAF5EE] text-[#167C49] border border-[#167C49] text-xs sm:text-sm font-bold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Edit3 size={15} />
                <span>Editar Perfil</span>
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#163D2B] font-heading">
                {currentProf?.displayName || 'Brasileiro PapoBR'}
              </h1>
              <span className="text-xs sm:text-sm text-[#738078]">
                @{currentProf?.username}
              </span>
            </div>

            <p className="text-sm text-[#163D2B] mt-2.5 leading-relaxed">
              {currentProf?.bio || 'Bem-vindo ao meu espaço no PapoBR! 🇧🇷'}
            </p>

            {/* Metadados: Localização e Entrada */}
            <div className="flex items-center gap-4 text-xs text-[#738078] mt-3.5 flex-wrap">
              {currentProf?.city && currentProf?.state && (
                <span className="flex items-center gap-1 text-[#167C49] font-medium">
                  <MapPin size={14} />
                  {currentProf.city}, {currentProf.state}
                </span>
              )}

              <span className="flex items-center gap-1">
                <Calendar size={14} />
                No PapoBR desde {formatRelativeTime(currentProf?.createdAt || '')}
              </span>
            </div>

            {/* Contadores */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#E5EBE7] text-xs sm:text-sm">
              <div>
                <span className="font-extrabold text-[#163D2B] mr-1">{posts.length}</span>
                <span className="text-[#738078]">Publicações</span>
              </div>
              <div>
                <span className="font-extrabold text-[#163D2B] mr-1">
                  {currentProf?.friendsCount || 12}
                </span>
                <span className="text-[#738078]">Amigos no Brasil</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Abas do Perfil */}
      <div className="flex bg-white p-1 rounded-2xl border border-[#E5EBE7] shadow-xs">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-[#EAF5EE] text-[#167C49]'
              : 'text-[#738078] hover:text-[#163D2B]'
          }`}
        >
          <FileText size={16} />
          <span>Publicações ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'friends'
              ? 'bg-[#EAF5EE] text-[#167C49]'
              : 'text-[#738078] hover:text-[#163D2B]'
          }`}
        >
          <Users size={16} />
          <span>Amigos ({currentProf?.friendsCount || 12})</span>
        </button>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-[#E5EBE7]">
              <p className="text-xs text-[#738078]">
                {isOwnProfile
                  ? 'Você ainda não publicou nada. Que tal contar o que está pensando no início?'
                  : 'Este usuário ainda não possui publicações.'}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'friends' && (
        <div className="bg-white rounded-2xl p-5 border border-[#E5EBE7] grid grid-cols-2 gap-3">
          {[
            { name: 'Mariana Azevedo', user: 'mariana_az', city: 'São Paulo, SP' },
            { name: 'Carlos Eduardo', user: 'cadu_rio', city: 'Rio de Janeiro, RJ' },
            { name: 'Beatriz Martins', user: 'biamartins', city: 'Belo Horizonte, MG' },
            { name: 'Lucas Pinheiro', user: 'lucaspinheiro', city: 'Recife, PE' },
          ].map((f) => (
            <div key={f.user} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F4F7F5]">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${f.user}`}
                alt={f.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-[#163D2B] truncate">{f.name}</p>
                <p className="text-[10px] text-[#738078] truncate">📍 {f.city}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edição de Perfil */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E5EBE7] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-5 right-5 p-1.5 text-[#738078] hover:bg-[#F4F7F5] rounded-full"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-[#163D2B] font-heading mb-4">
              Editar Meu Perfil
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Fotos */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#163D2B]">
                  Foto de Perfil & Capa
                </label>
                <div className="flex gap-3">
                  <label className="flex-1 p-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-center text-xs text-[#167C49] font-semibold cursor-pointer hover:bg-[#EAF5EE] transition-colors flex items-center justify-center gap-1.5">
                    <Camera size={14} />
                    <span>Mudar Foto</span>
                    <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
                  </label>
                  <label className="flex-1 p-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-center text-xs text-[#167C49] font-semibold cursor-pointer hover:bg-[#EAF5EE] transition-colors flex items-center justify-center gap-1.5">
                    <Camera size={14} />
                    <span>Mudar Capa</span>
                    <input type="file" accept="image/*" onChange={handleCoverFile} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#163D2B] mb-1">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-sm text-[#163D2B] focus:bg-white focus:border-[#167C49] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#163D2B] mb-1">
                  Biografia
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-sm text-[#163D2B] focus:bg-white focus:border-[#167C49] focus:outline-hidden resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#163D2B] mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-sm text-[#163D2B] focus:bg-white focus:border-[#167C49] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#163D2B] mb-1">
                    Estado (UF)
                  </label>
                  <select
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-sm text-[#163D2B] focus:bg-white focus:border-[#167C49] focus:outline-hidden"
                  >
                    {ESTADOS_BRASIL.map((uf) => (
                      <option key={uf.sigla} value={uf.sigla}>
                        {uf.sigla} - {uf.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5EBE7]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold text-[#738078] hover:bg-[#F4F7F5] rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#167C49] hover:bg-[#115D38] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
