/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  AtSign,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ESTADOS_BRASIL } from '../../lib/utils';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    signInWithGoogle,
    signInAsDemoUser,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');

  if (!isAuthModalOpen) return null;

  const resetForm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithGoogle();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Não foi possível entrar com o Google. Tente criar sua conta com e-mail ou use o acesso de teste abaixo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMsg('Informe o seu e-mail cadastrado.');
        return;
      }
      try {
        setLoading(true);
        await resetPassword(email.trim());
        setSuccessMsg('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      } catch (err: unknown) {
        setErrorMsg('E-mail não encontrado ou formato inválido.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'login') {
      if (!email || !password) {
        setErrorMsg('Preencha seu e-mail e sua senha.');
        return;
      }
      try {
        setLoading(true);
        await signInWithEmail(email.trim(), password);
      } catch (err: unknown) {
        console.error(err);
        setErrorMsg('E-mail ou senha incorretos. Por favor confira seus dados.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMsg('Informe seu nome completo.');
        return;
      }
      if (!username.trim() || username.trim().length < 3) {
        setErrorMsg('Escolha um nome de usuário com pelo menos 3 letras ou números.');
        return;
      }
      if (!email.trim() || !password) {
        setErrorMsg('Preencha e-mail e senha.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('A senha precisa ter no mínimo 6 caracteres.');
        return;
      }

      try {
        setLoading(true);
        await signUpWithEmail({
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
          city: city.trim(),
          state,
        });
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg('Erro ao cadastrar. Verifique os dados e tente novamente.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E5EBE7] overflow-hidden p-6 sm:p-8">
        {/* Fechar botão */}
        <button
          onClick={() => {
            setIsAuthModalOpen(false);
            resetForm();
          }}
          className="absolute top-5 right-5 p-1.5 text-[#738078] hover:bg-[#F4F7F5] rounded-full transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <img
            src="/assets/aistudio/image_ac2ee06d.png"
            alt="PapoBR"
            className="h-10 mx-auto mb-2 object-contain"
          />
          <h3 className="text-xl font-extrabold text-[#163D2B] font-heading">
            {mode === 'login'
              ? 'Bem-vindo de volta!'
              : mode === 'signup'
              ? 'Crie seu espaço no PapoBR'
              : 'Recuperar acesso à conta'}
          </h3>
          <p className="text-xs text-[#738078] mt-1">
            {mode === 'login'
              ? 'Conecte-se com brasileiros de todas as regiões.'
              : mode === 'signup'
              ? 'Junte-se à comunidade brasileira que mais cresce.'
              : 'Digite seu e-mail para receber as instruções.'}
          </p>
        </div>

        {/* Alternador de Abas */}
        {mode !== 'forgot' && (
          <div className="flex bg-[#F4F7F5] p-1 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#167C49] shadow-xs'
                  : 'text-[#738078] hover:text-[#163D2B]'
              }`}
            >
              Já tenho conta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-[#167C49] shadow-xs'
                  : 'text-[#738078] hover:text-[#163D2B]'
              }`}
            >
              Criar nova conta
            </button>
          </div>
        )}

        {/* Mensagens de Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold">{errorMsg}</p>
                {errorMsg.includes('Google') && (
                  <div className="mt-2.5 pt-2.5 border-t border-red-200">
                    <p className="text-[11px] text-red-700 mb-2 font-medium">
                      💡 Acesse sem bloqueios de pop-up ou autorização de domínio:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          signInAsDemoUser('Carlos Eduardo (PapoBR)', 'carloseduardo_br');
                        }}
                        className="flex-1 py-1.5 px-3 bg-[#167C49] hover:bg-[#115D38] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
                      >
                        ⚡ Entrar com 1 Clique (Carlos)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setMode('signup');
                        }}
                        className="py-1.5 px-3 bg-white border border-red-300 text-red-700 hover:bg-red-100/50 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
                      >
                        Criar com E-mail
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-2.5 text-xs text-green-700">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Botão Google rápido */}
        {mode !== 'forgot' && (
          <div className="mb-5 space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#163D2B] text-sm font-semibold rounded-2xl shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar com Google</span>
            </button>

            {/* Acesso rápido sem bloqueio de pop-up com seleção de usuário de teste */}
            <div className="bg-[#EAF5EE] rounded-2xl p-2.5 border border-[#167C49]/20">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[11px] font-bold text-[#167C49] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#F3C84B] fill-[#F3C84B]" />
                  Acesso Imediato (Perfis de Demonstração)
                </span>
                <span className="text-[10px] bg-[#167C49]/10 text-[#167C49] px-1.5 py-0.5 rounded-full font-semibold">1 clique</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => signInAsDemoUser('Carlos Eduardo (PapoBR)', 'carloseduardo_br')}
                  className="py-1.5 px-2 bg-white hover:bg-[#167C49] hover:text-white text-[#163D2B] text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs border border-[#167C49]/15 text-left flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="truncate">Carlos (RJ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => signInAsDemoUser('Maria Silva (PapoBR)', 'mariasilva_sp')}
                  className="py-1.5 px-2 bg-white hover:bg-[#167C49] hover:text-white text-[#163D2B] text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs border border-[#167C49]/15 text-left flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="truncate">Maria (SP)</span>
                </button>
              </div>
            </div>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5EBE7]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-[#738078]">ou acesse com seu e-mail</span>
              </div>
            </div>
          </div>
        )}

        {/* Formulário Principal */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#163D2B] mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#738078]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full pl-9 pr-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-sm text-[#163D2B] focus:bg-white focus:border-[#167C49] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#163D2B] mb-1">
                  Nome de Usuário (@arroba)
                </label>
                <div className="relative">
                  <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#738078]" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="joaosilva"
                    className="w-full pl-9 pr-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-sm text-[#163D2B] focus:bg-white focus:border-[#167C49] focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-[#738078] mt-0.5">
                  Exclusivo, letras minúsculas, números e sublinhado.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#163D2B] mb-1">
                    Cidade
                  </label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#738078]" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Sua cidade"
                      className="w-full pl-8 pr-2 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-sm text-[#163D2B] focus:bg-white focus:border-[#167C49] focus:outline-hidden"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#163D2B] mb-1">
                    Estado (UF)
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
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
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-[#163D2B] mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#738078]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com.br"
                className="w-full pl-9 pr-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-sm text-[#163D2B] focus:bg-white focus:border-[#167C49] focus:outline-hidden"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-[#163D2B]">
                  Senha
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg(null);
                    }}
                    className="text-[11px] font-semibold text-[#167C49] hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#738078]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-[#F4F7F5] border border-[#E5EBE7] rounded-xl text-sm text-[#163D2B] focus:bg-white focus:border-[#167C49] focus:outline-hidden"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#167C49] hover:bg-[#115D38] text-white text-sm font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Processando...</span>
              </>
            ) : mode === 'login' ? (
              'Entrar no PapoBR'
            ) : mode === 'signup' ? (
              <>
                <Sparkles size={16} className="text-[#F3C84B]" />
                Cadastrar e Começar
              </>
            ) : (
              'Enviar Link de Recuperação'
            )}
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className="w-full text-xs font-bold text-[#167C49] py-1 text-center hover:underline cursor-pointer"
            >
              ← Voltar para o Login
            </button>
          )}
        </form>

        <p className="text-[11px] text-center text-[#738078] mt-5">
          Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade do PapoBR em conformidade com a LGPD.
        </p>
      </div>
    </div>
  );
};
