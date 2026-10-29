/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  MapPin,
  Tag,
  MessageCircle,
  X,
  Loader2,
  DollarSign,
  Heart,
  Share2,
  Edit,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Flag,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MarketplaceItem } from '../../types';
import {
  subscribeToMarketplace,
  createMarketplaceItem,
  updateMarketplaceItem,
  deleteMarketplaceItem,
  submitReport,
} from '../../services/socialService';
import { formatCurrency, ESTADOS_BRASIL, formatRelativeTime, compressImage } from '../../lib/utils';

interface MarketplaceViewProps {
  onContactSeller?: (seller: { uid: string; displayName: string; username: string; photoURL?: string }) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ onContactSeller }) => {
  const { user, profile, setIsAuthModalOpen } = useAuth();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'myItems'>('all');

  // Filtros
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedState, setSelectedState] = useState<string>('Todos');
  const [priceFilter, setPriceFilter] = useState<string>('all');

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Golpe / Preço Fictício');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Favoritos (salvo em localStorage para persistência imediata)
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('papobr_favorites') || '{}');
    } catch {
      return {};
    }
  });

  // Formulário Anúncio
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState('Eletrônicos & Celulares');
  const [city, setCity] = useState(profile?.city || 'São Paulo');
  const [state, setState] = useState(profile?.state || 'SP');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    'Todas',
    'Eletrônicos & Celulares',
    'Instrumentos Musicais',
    'Esportes & Lazer',
    'Móveis & Decoração',
    'Veículos & Peças',
    'Moda & Acessórios',
    'Serviços & Outros',
  ];

  useEffect(() => {
    const unsub = subscribeToMarketplace((loaded) => {
      setItems(loaded);
    });
    return () => unsub();
  }, []);

  const toggleFavorite = (itemId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      localStorage.setItem('papobr_favorites', JSON.stringify(next));
      return next;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        const compressed = await compressImage(files[i], 1000, 0.75);
        newUrls.push(compressed);
      }
      setImages((prev) => [...prev, ...newUrls].slice(0, 3));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (item: MarketplaceItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setPrice(item.price.toString());
    setCategory(item.category);
    setCity(item.city);
    setState(item.state);
    setImages(item.imageUrls || []);
  };

  const handleDeleteItem = async (itemId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Deseja realmente excluir este anúncio do Mercado PapoBR?')) return;
    try {
      await deleteMarketplaceItem(itemId);
      if (selectedItem?.id === itemId) setSelectedItem(null);
    } catch (err) {
      console.error('Falha ao excluir anúncio:', err);
    }
  };

  const handleToggleSold = async (item: MarketplaceItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextStatus = item.status === 'sold' ? 'active' : 'sold';
    try {
      await updateMarketplaceItem(item.id, { status: nextStatus });
      if (selectedItem?.id === item.id) {
        setSelectedItem((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch (err) {
      console.error('Falha ao atualizar status:', err);
    }
  };

  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      setIsAuthModalOpen(true);
      return;
    }
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      alert('Informe um valor válido em reais.');
      return;
    }

    try {
      setLoading(true);
      const fallbackImages = ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'];
      const finalImages = images.length > 0 ? images : fallbackImages;

      if (editingItem) {
        // Atualizar anúncio existente
        await updateMarketplaceItem(editingItem.id, {
          title: title.trim(),
          description: description.trim(),
          price: numericPrice,
          category,
          city: city.trim(),
          state,
          imageUrls: finalImages,
        });
        setEditingItem(null);
      } else {
        // Criar novo
        await createMarketplaceItem(profile, {
          title: title.trim(),
          description: description.trim(),
          price: numericPrice,
          category,
          city: city.trim(),
          state,
          imageUrls: finalImages,
        });
        setIsCreateModalOpen(false);
      }

      setTitle('');
      setDescription('');
      setPrice('');
      setImages([]);
    } catch (err) {
      console.error('Falha ao salvar anúncio:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    await submitReport(user?.uid || 'anon', 'post', selectedItem.id, `Marketplace: ${reportReason}`);
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setShowReportModal(false);
    }, 2000);
  };

  // Filtragem de Itens
  const filteredItems = items.filter((item) => {
    if (activeTab === 'favorites' && !favorites[item.id]) return false;
    if (activeTab === 'myItems' && item.sellerId !== user?.uid) return false;

    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
    const matchesState = selectedState === 'Todos' || item.state === selectedState;

    // Filtro por faixa de preço
    let matchesPrice = true;
    if (priceFilter === 'under200') matchesPrice = item.price <= 200;
    else if (priceFilter === '200to1000') matchesPrice = item.price > 200 && item.price <= 1000;
    else if (priceFilter === '1000to3000') matchesPrice = item.price > 1000 && item.price <= 3000;
    else if (priceFilter === 'above3000') matchesPrice = item.price > 3000;

    return matchesSearch && matchesCategory && matchesState && matchesPrice;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Banner Oficial do Mercado PapoBR */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5EBE7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EE] text-[#167C49] text-xs font-bold mb-2">
            <ShoppingBag size={14} />
            <span>Mercado PapoBR</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#163D2B] font-heading">
            Classificados Brasileiros com Segurança
          </h1>
          <p className="text-xs sm:text-sm text-[#738078] mt-1">
            Compre, venda e negocie produtos em reais direto com pessoas do seu estado e do Brasil.
          </p>
        </div>

        <button
          onClick={() => {
            if (!user) setIsAuthModalOpen(true);
            else {
              setEditingItem(null);
              setTitle('');
              setDescription('');
              setPrice('');
              setImages([]);
              setIsCreateModalOpen(true);
            }
          }}
          className="bg-[#167C49] hover:bg-[#115D38] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus size={18} />
          <span>Criar Anúncio Grátis</span>
        </button>
      </div>

      {/* Abas de Navegação do Marketplace */}
      <div className="flex bg-white p-1 rounded-2xl border border-[#E5EBE7] shadow-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#EAF5EE] text-[#167C49]'
              : 'text-[#738078] hover:text-[#163D2B]'
          }`}
        >
          Todos os Produtos
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'favorites'
              ? 'bg-[#EAF5EE] text-[#167C49]'
              : 'text-[#738078] hover:text-[#163D2B]'
          }`}
        >
          <Heart size={14} className={activeTab === 'favorites' ? 'fill-[#167C49]' : ''} />
          <span>Favoritos ({Object.values(favorites).filter(Boolean).length})</span>
        </button>
        {user && (
          <button
            onClick={() => setActiveTab('myItems')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'myItems'
                ? 'bg-[#EAF5EE] text-[#167C49]'
                : 'text-[#738078] hover:text-[#163D2B]'
            }`}
          >
            Meus Anúncios
          </button>
        )}
      </div>

      {/* Barra de Filtros: Pesquisa, Estado (UF) e Faixa de Preço */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5EBE7] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative col-span-1 sm:col-span-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#738078]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por produto..."
              className="w-full bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl py-2 pl-9 pr-3 text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:outline-hidden"
            >
              <option value="Todos">Todos os Estados (UF)</option>
              {ESTADOS_BRASIL.map((uf) => (
                <option key={uf.sigla} value={uf.sigla}>
                  {uf.sigla} - {uf.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="w-full bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:outline-hidden"
            >
              <option value="all">Qualquer valor em R$</option>
              <option value="under200">Até R$ 200,00</option>
              <option value="200to1000">De R$ 200 a R$ 1.000,00</option>
              <option value="1000to3000">De R$ 1.000 a R$ 3.000,00</option>
              <option value="above3000">Acima de R$ 3.000,00</option>
            </select>
          </div>
        </div>

        {/* Categorias Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#167C49] text-white font-bold'
                  : 'bg-[#F4F7F5] text-[#738078] hover:text-[#163D2B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isFav = favorites[item.id];
          const isMine = user?.uid === item.sellerId;
          const isSold = item.status === 'sold';

          return (
            <div
              key={item.id}
              onClick={() => {
                setSelectedItem(item);
                setSelectedPhotoIndex(0);
              }}
              className="bg-white rounded-2xl overflow-hidden border border-[#E5EBE7] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative"
            >
              <div>
                <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
                  <img
                    src={item.imageUrls?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
                    alt={item.title}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isSold ? 'grayscale opacity-75' : ''}`}
                  />

                  {/* Badge Vendido */}
                  {isSold && (
                    <span className="absolute top-2.5 left-2.5 bg-gray-900 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase">
                      Vendido
                    </span>
                  )}

                  <button
                    onClick={(e) => toggleFavorite(item.id, e)}
                    className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                      isFav ? 'bg-red-50 text-red-500' : 'bg-black/30 text-white hover:bg-black/50'
                    }`}
                  >
                    <Heart size={16} className={isFav ? 'fill-red-500' : ''} />
                  </button>

                  <span className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-[#167C49] font-extrabold text-xs px-2.5 py-1 rounded-lg font-heading shadow-xs">
                    {formatCurrency(item.price)}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-[#163D2B] text-sm line-clamp-1 font-heading group-hover:text-[#167C49] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#738078] line-clamp-2 mt-1">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Rodapé do Card */}
              <div className="px-4 pb-4 pt-2 border-t border-[#E5EBE7]/60 flex items-center justify-between text-[11px] text-[#738078]">
                <span className="flex items-center gap-1 font-medium text-[#167C49]">
                  <MapPin size={12} />
                  {item.city}, {item.state}
                </span>

                {isMine ? (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleOpenEdit(item, e)}
                      className="p-1 text-[#167C49] hover:bg-[#EAF5EE] rounded-md transition-colors"
                      title="Editar anúncio"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Excluir anúncio"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <span>{formatRelativeTime(item.createdAt)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#E5EBE7]">
          <ShoppingBag size={36} className="mx-auto text-[#167C49] mb-3 opacity-40" />
          <h3 className="text-base font-bold text-[#163D2B] font-heading mb-1">
            Nenhum produto encontrado
          </h3>
          <p className="text-xs text-[#738078]">
            Tente mudar os filtros de categoria, faixa de preço ou estado.
          </p>
        </div>
      )}

      {/* MODAL 1: Detalhes do Produto com Slider de Fotos e Contato */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#E5EBE7] shadow-2xl overflow-hidden relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10 cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Imagem Principal */}
            <div className="aspect-video bg-gray-100 overflow-hidden relative">
              <img
                src={selectedItem.imageUrls?.[selectedPhotoIndex] || selectedItem.imageUrls?.[0] || ''}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
              />
              {selectedItem.status === 'sold' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-lg font-extrabold uppercase tracking-widest bg-red-600 px-4 py-1.5 rounded-xl">
                    Produto Vendido
                  </span>
                </div>
              )}
            </div>

            {/* Miniaturas de Fotos se houver mais de uma */}
            {selectedItem.imageUrls && selectedItem.imageUrls.length > 1 && (
              <div className="flex gap-2 p-3 bg-gray-50 border-b border-[#E5EBE7] overflow-x-auto">
                {selectedItem.imageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`w-16 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedPhotoIndex === idx ? 'border-[#167C49] scale-105' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="p-6">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-2xl font-extrabold text-[#167C49] font-heading">
                  {formatCurrency(selectedItem.price)}
                </span>
                <span className="text-xs bg-[#EAF5EE] text-[#167C49] px-3 py-1 rounded-full font-bold">
                  {selectedItem.category}
                </span>
              </div>

              <h2 className="text-lg font-bold text-[#163D2B] font-heading mb-2">
                {selectedItem.title}
              </h2>

              <p className="text-xs text-[#738078] flex items-center gap-1 mb-4">
                <MapPin size={14} className="text-[#167C49]" />
                {selectedItem.city}, {selectedItem.state} • Anunciado {formatRelativeTime(selectedItem.createdAt)}
              </p>

              <div className="p-3.5 bg-[#F4F7F5] rounded-2xl mb-4 text-xs text-[#163D2B] leading-relaxed">
                <p className="font-bold mb-1 text-[#167C49]">Detalhes do Anúncio:</p>
                <p className="whitespace-pre-line">{selectedItem.description}</p>
              </div>

              {/* Informações do Vendedor */}
              <div className="p-4 border border-[#E5EBE7] rounded-2xl flex items-center justify-between mb-4 bg-white">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedItem.sellerPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedItem.sellerId}`}
                    alt={selectedItem.sellerName}
                    className="w-11 h-11 rounded-full object-cover border border-[#167C49]/20"
                  />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#163D2B]">{selectedItem.sellerName}</h4>
                    <p className="text-[11px] text-[#738078]">
                      Vendedor PapoBR • 📍 {selectedItem.city}, {selectedItem.state}
                    </p>
                  </div>
                </div>

                {user?.uid === selectedItem.sellerId ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleSold(selectedItem)}
                      className="px-3 py-1.5 text-xs font-bold border border-[#167C49] text-[#167C49] hover:bg-[#EAF5EE] rounded-xl transition-colors cursor-pointer"
                    >
                      {selectedItem.status === 'sold' ? 'Reativar' : 'Marcar Vendido'}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(selectedItem)}
                      className="px-3 py-1.5 text-xs font-bold bg-[#167C49] text-white rounded-xl hover:bg-[#115D38] cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedItem(null);
                      if (onContactSeller) {
                        onContactSeller({
                          uid: selectedItem.sellerId,
                          displayName: selectedItem.sellerName,
                          username: selectedItem.sellerUsername || 'vendedor',
                          photoURL: selectedItem.sellerPhotoURL,
                        });
                      }
                    }}
                    className="bg-[#167C49] hover:bg-[#115D38] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <MessageCircle size={15} />
                    <span>Chamar no Papo</span>
                  </button>
                )}
              </div>

              {/* Dica de Segurança Antifraude */}
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 mb-4">
                <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Dica de Segurança PapoBR:</strong> Nunca realize pagamentos antecipados sem antes conferir o item. Prefira encontros presenciais em locais públicos e seguros.
                </p>
              </div>

              {/* Denúncia de Anúncio Suspeito */}
              {user?.uid !== selectedItem.sellerId && (
                <div className="text-right">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="text-xs text-[#738078] hover:text-red-600 flex items-center gap-1 ml-auto font-medium transition-colors cursor-pointer"
                  >
                    <Flag size={13} />
                    <span>Denunciar anúncio suspeito</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Criar / Editar Anúncio */}
      {(isCreateModalOpen || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#E5EBE7] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingItem(null);
              }}
              className="absolute top-5 right-5 p-1.5 text-[#738078] hover:bg-[#F4F7F5] rounded-full"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-[#163D2B] font-heading mb-4">
              {editingItem ? 'Editar Anúncio no Mercado PapoBR' : 'Criar Novo Anúncio no Mercado PapoBR'}
            </h3>

            <form onSubmit={handleSaveListing} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#163D2B] mb-1">
                  Título do Produto
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Violão Tagima Clássico Nylon"
                  className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:border-[#167C49] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#163D2B] mb-1">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 450,00"
                    className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:border-[#167C49] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#163D2B] mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:outline-hidden"
                  >
                    {categories.filter((c) => c !== 'Todas').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#163D2B] mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#163D2B] mb-1">
                    Estado (UF)
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:outline-hidden"
                  >
                    {ESTADOS_BRASIL.map((uf) => (
                      <option key={uf.sigla} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#163D2B] mb-1">
                  Descrição dos detalhes
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o estado de conservação, acessórios e local de entrega..."
                  className="w-full px-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#163D2B] mb-1">
                  Fotos do Produto (até 3)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="w-full text-xs text-[#738078] file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#EAF5EE] file:text-[#167C49] hover:file:bg-[#167C49] hover:file:text-white cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5EBE7]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-[#738078] hover:bg-[#F4F7F5] rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#167C49] hover:bg-[#115D38] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />}
                  <span>{editingItem ? 'Salvar Alterações' : 'Publicar Anúncio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Denúncia de Anúncio */}
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
              <span>Denunciar este Anúncio</span>
            </h3>

            {reportSuccess ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-xs text-green-700 text-center">
                Denúncia registrada com sucesso. A moderação analisará este anúncio.
              </div>
            ) : (
              <form onSubmit={handleSendReport} className="space-y-3">
                <p className="text-xs text-[#738078]">
                  Selecione a irregularidade detectada:
                </p>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-xs text-[#163D2B] focus:outline-hidden"
                >
                  <option value="Golpe / Preço Fictício">Preço Suspeito ou Tentativa de Golpe</option>
                  <option value="Produto Falsificado">Produto Ilegal ou Falsificado</option>
                  <option value="Vendedor Não Responde">Vendedor Inativo / Enganoso</option>
                  <option value="Conteúdo Ofensivo">Conteúdo Impróprio nas fotos/texto</option>
                </select>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3 py-1.5 text-xs text-[#738078] hover:bg-[#F4F7F5] rounded-xl font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
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
