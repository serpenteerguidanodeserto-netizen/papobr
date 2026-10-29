/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Send,
  MapPin,
  Check,
  X,
} from 'lucide-react';
import { Post, Comment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  toggleLikePost,
  subscribeToPostLikes,
  subscribeToComments,
  addCommentToPost,
  deletePostById,
  deleteCommentFromPost,
} from '../../services/postsService';
import { formatRelativeTime } from '../../lib/utils';

interface PostCardProps {
  post: Post;
  onPostDeleted?: () => void;
  onAuthorClick?: (authorId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPostDeleted,
  onAuthorClick,
}) => {
  const { user, profile, setIsAuthModalOpen } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Sync like state from Firestore
  useEffect(() => {
    if (!user) {
      setIsLiked(false);
      return;
    }
    const unsub = subscribeToPostLikes(post.id, user.uid, (liked) => {
      setIsLiked(liked);
    });
    return () => unsub();
  }, [post.id, user]);

  // Sync comments
  useEffect(() => {
    if (!showComments) return;
    const unsub = subscribeToComments(post.id, (loadedComments) => {
      setComments(loadedComments);
    });
    return () => unsub();
  }, [post.id, showComments]);

  const handleLike = async () => {
    if (!user || !profile) {
      setIsAuthModalOpen(true);
      return;
    }
    // Optimistic UI
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await toggleLikePost(post.id, user.uid, profile);
    } catch (err) {
      // Revert on error
      setIsLiked(!nextState);
      setLikesCount((prev) => (nextState ? Math.max(0, prev - 1) : prev + 1));
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!newComment.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      await addCommentToPost(post.id, profile, newComment.trim());
      setNewComment('');
    } catch (err) {
      console.error('Erro ao comentar:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Deseja realmente excluir esta publicação?')) return;
    try {
      await deletePostById(post.id);
      if (onPostDeleted) onPostDeleted();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Deseja excluir este comentário?')) return;
    try {
      await deleteCommentFromPost(post.id, commentId);
    } catch (err) {
      console.error('Erro ao excluir comentário:', err);
    }
  };

  const isAuthor = user?.uid === post.authorId;

  return (
    <>
      <article className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EBE7] shadow-xs hover:shadow-md transition-shadow">
        {/* Topo: Autor & Data */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onAuthorClick?.(post.authorId)}
              className="focus:outline-hidden shrink-0 group"
            >
              <img
                src={
                  post.authorPhotoURL ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorUsername}`
                }
                alt={post.authorName}
                className="w-11 h-11 rounded-full object-cover border border-[#167C49]/20 group-hover:border-[#167C49] transition-colors"
              />
            </button>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onAuthorClick?.(post.authorId)}
                  className="font-bold text-[#163D2B] hover:text-[#167C49] text-sm font-heading transition-colors"
                >
                  {post.authorName}
                </button>
                <span className="text-xs text-[#738078]">
                  @{post.authorUsername}
                </span>
                {post.communityName && (
                  <span className="text-[11px] bg-[#EAF5EE] text-[#167C49] font-semibold px-2 py-0.5 rounded-full">
                    em {post.communityName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-[#738078] mt-0.5">
                <span>{formatRelativeTime(post.createdAt)}</span>
                {post.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-[#167C49] font-medium">
                      <MapPin size={12} />
                      {post.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Menu de Opções */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-[#738078] hover:bg-[#F4F7F5] rounded-full transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E5EBE7] rounded-xl shadow-lg py-1.5 z-20 animate-in fade-in zoom-in-95">
                {isAuthor ? (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleDelete();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                  >
                    <Trash2 size={15} />
                    Excluir publicação
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      alert('Obrigado. Esta publicação foi sinalizada para a moderação do PapoBR.');
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-[#738078] hover:bg-[#F4F7F5] flex items-center gap-2 font-medium"
                  >
                    Denunciar publicação
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo textual */}
        <p className="text-sm text-[#163D2B] whitespace-pre-line leading-relaxed mb-3">
          {post.content}
        </p>

        {/* Tags da publicação */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.map((t) => (
              <span
                key={t}
                className="text-xs text-[#167C49] bg-[#EAF5EE] hover:bg-[#167C49] hover:text-white px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Imagens Anexadas */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div
            className={`grid gap-2 mb-4 rounded-2xl overflow-hidden ${
              post.imageUrls.length === 1
                ? 'grid-cols-1'
                : post.imageUrls.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-2 md:grid-cols-3'
            }`}
          >
            {post.imageUrls.map((url, idx) => (
              <div
                key={idx}
                onClick={() => setExpandedImage(url)}
                className="relative group cursor-pointer overflow-hidden max-h-[420px] bg-gray-100"
              >
                <img
                  src={url}
                  alt={`Imagem do post ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Barra de Contadores e Botões de Interação */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E5EBE7]">
          {/* Botão Curtir */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              isLiked
                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                : 'text-[#738078] hover:text-red-600 hover:bg-[#F4F7F5]'
            }`}
          >
            <Heart
              size={18}
              className={`transition-transform duration-150 ${
                isLiked ? 'fill-red-600 scale-110 text-red-600' : ''
              }`}
            />
            <span>{likesCount}</span>
            <span className="hidden sm:inline font-normal">
              {likesCount === 1 ? 'Curtida' : 'Curtidas'}
            </span>
          </button>

          {/* Botão Comentar */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              showComments
                ? 'bg-[#EAF5EE] text-[#167C49]'
                : 'text-[#738078] hover:text-[#167C49] hover:bg-[#F4F7F5]'
            }`}
          >
            <MessageCircle size={18} />
            <span>{post.commentsCount || comments.length}</span>
            <span className="hidden sm:inline font-normal">Comentários</span>
          </button>

          {/* Botão Compartilhar */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#738078] hover:text-[#167C49] hover:bg-[#F4F7F5] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check size={18} className="text-[#167C49]" />
                <span className="text-[#167C49]">Copiado!</span>
              </>
            ) : (
              <>
                <Share2 size={18} />
                <span className="hidden sm:inline font-normal">Compartilhar</span>
              </>
            )}
          </button>
        </div>

        {/* Seção de Comentários Expansível */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-[#E5EBE7] space-y-3">
            {/* Campo para novo comentário */}
            <form onSubmit={handleAddComment} className="flex gap-2.5">
              <img
                src={
                  profile?.photoURL ||
                  (user
                    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`
                    : 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest')
                }
                alt="Você"
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onFocus={() => {
                    if (!user) setIsAuthModalOpen(true);
                  }}
                  placeholder={user ? 'Escreva um comentário carinhoso...' : 'Entre para comentar...'}
                  className="w-full bg-[#F4F7F5] focus:bg-white border border-[#E5EBE7] focus:border-[#167C49] rounded-full py-2 pl-3.5 pr-10 text-xs sm:text-sm text-[#163D2B] focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#167C49] disabled:opacity-30 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>

            {/* Lista de comentários */}
            {comments.length > 0 ? (
              <div className="space-y-2.5 pt-2">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5 text-xs">
                    <img
                      src={
                        c.authorPhotoURL ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.authorUsername}`
                      }
                      alt={c.authorName}
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div className="flex-1 bg-[#F4F7F5] rounded-2xl p-2.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-[#163D2B] font-heading">
                          {c.authorName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#738078]">
                            {formatRelativeTime(c.createdAt)}
                          </span>
                          {(user?.uid === c.authorId || user?.uid === post.authorId) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                              title="Excluir comentário"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[#163D2B] leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs text-[#738078] py-2">
                Seja o primeiro brasileiro a comentar esta publicação!
              </p>
            )}
          </div>
        )}
      </article>

      {/* Lightbox Modal de Imagem */}
      {expandedImage && (
        <div
          onClick={() => setExpandedImage(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
        >
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <X size={24} />
          </button>
          <img
            src={expandedImage}
            alt="Imagem ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </>
  );
};
