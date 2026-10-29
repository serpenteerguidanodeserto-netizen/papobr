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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MarketplaceItem } from '../../types';
import {
  subscribeToMarketplace,
  createMarketplaceItem,
} from '../../services/socialService';
import { formatCurrency, ESTADOS_BRASIL, formatRelativeTime, compressImage } from '../../lib/utils';

interface MarketplaceViewProps {
  onContactSeller?: (seller: { uid: string; displayName: string; username: string; photoURL?: string }) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ onContactSeller }) => {
  const { user, profile, setIsAuthModalOpen } = useAuth();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedState, setSelectedState] = useState<string>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // New item form states
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

  const handleCreateItem = async (e: React.FormEvent) => {
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
      await createMarketplaceItem(profile, {
        title: title.trim(),
        description: description.trim(),
        price: numericPrice,
        category,
        city: city.trim(),
        state,
        imageUrls: images.length > 0 ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
      });

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setPrice('');
      setImages([]);
    } catch (err) {
      console.error('Falha ao anunciar:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
    const matchesState = selectedState === 'Todos' || item.state === selectedState;
    return matchesSearch && matchesCategory && matchesState;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Banner do Mercado PapoBR */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5EBE7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EE] text-[#167C49] text-xs font-bold mb-2">
            <ShoppingBag size={14} />
            <span>Mercado PapoBR</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#163D2B] font-heading">
            Compre e Venda com Segurança no Brasil
          </h1>
          <p className="text-xs sm:text-sm text-[#738078] mt-1">
            Negocie direto com outros brasileiros, sem taxas intermediárias abusivas.
          </p>
        </div>

        <button
          onClick={() => {
            if (!user) setIsAuthModalOpen(true);
            else setIsModalOpen(true);
          }}
          className="bg-[#167C49] hover:bg-[#115D38] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus size={18} />
          <span>Criar Anúncio</span>
        </button>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5EBE7] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#738078]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar instrumentos, carros, eletrônicos..."
              className="w-full bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl py-2 pl-9 pr-3 text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:border-[#167C49] focus:outline-hidden"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#163D2B] focus:bg-white focus:outline-hidden"
            >
              <option value="Todos">Todos os Estados (BR)</option>
              {ESTADOS_BRASIL.map((uf) => (
                <option key={uf.sigla} value={uf.sigla}>
                  {uf.sigla} - {uf.nome}
                </option>
              ))}
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

      {/* Grid de Itens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isFav = favorites[item.id];
          return (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-white rounded-2xl overflow-hidden border border-[#E5EBE7] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
                  <img
                    src={item.imageUrls?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFavorites((prev) => ({ ...prev, [item.id]: !isFav }));
                    }}
                    className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-colors ${
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

              <div className="px-4 pb-4 pt-2 border-t border-[#E5EBE7]/60 flex items-center justify-between text-[11px] text-[#738078]">
                <span className="flex items-center gap-1 font-medium text-[#167C49]">
                  <MapPin size={12} />
                  {item.city}, {item.state}
                </span>
                <span>{formatRelativeTime(item.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Detalhes do Produto */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E5EBE7] shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10"
            >
              <X size={18} />
            </button>

            <div className="aspect-video bg-gray-100 overflow-hidden">
              <img
                src={selectedItem.imageUrls?.[0] || ''}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-2xl font-extrabold text-[#167C49] font-heading">
                  {formatCurrency(selectedItem.price)}
                </span>
                <span className="text-xs bg-[#EAF5EE] text-[#167C49] px-2.5 py-1 rounded-full font-bold">
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

              <div className="p-3 bg-[#F4F7F5] rounded-2xl mb-4 text-xs text-[#163D2B] leading-relaxed">
                <p className="font-bold mb-1 text-[#167C49]">Descrição do produto:</p>
                <p className="whitespace-pre-line">{selectedItem.description}</p>
              </div>

              {/* Informações do Vendedor */}
              <div className="p-3.5 border border-[#E5EBE7] rounded-2xl flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <img
                    src={selectedItem.sellerPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedItem.sellerId}`}
                    alt={selectedItem.sellerName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#163D2B]">{selectedItem.sellerName}</h4>
                    <p className="text-[10px] text-[#738078]">Vendedor verificado no PapoBR</p>
                  </div>
                </div>

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
                  className="bg-[#167C49] hover:bg-[#115D38] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle size={14} />
                  <span>Chamar no Papo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Anúncio */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#E5EBE7] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-[#738078] hover:bg-[#F4F7F5] rounded-full"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-[#163D2B] font-heading mb-4">
              Criar Novo Anúncio no Mercado PapoBR
            </h3>

            <form onSubmit={handleCreateItem} className="space-y-3.5">
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
                  placeholder="Descreva o estado de conservação, acessórios inclusos e forma de entrega..."
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
                  onClick={() => setIsModalOpen(false)}
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
                  <span>Publicar Anúncio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
