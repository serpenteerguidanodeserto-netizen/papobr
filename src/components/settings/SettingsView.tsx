/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  FileText,
  UserCheck,
  Download,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SettingsView: React.FC = () => {
  const { user, profile } = useAuth();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadMyData = () => {
    if (!profile) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `papobr_dados_${profile.username}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5EBE7] shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-[#EAF5EE] text-[#167C49] rounded-2xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#163D2B] font-heading">
              Configurações & Privacidade (LGPD)
            </h1>
            <p className="text-xs text-[#738078]">
              Seus direitos garantidos pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
            </p>
          </div>
        </div>
      </div>

      {/* Direitos do Titular de Dados */}
      <div className="bg-white rounded-3xl p-6 border border-[#E5EBE7] shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#163D2B] font-heading flex items-center gap-2">
          <UserCheck size={18} className="text-[#167C49]" />
          <span>Controle de Dados Pessoais</span>
        </h2>
        <p className="text-xs text-[#738078] leading-relaxed">
          No PapoBR, seus dados pertencem a você. Você pode consultar, retificar, solicitar a portabilidade ou a exclusão permanente de suas informações a qualquer momento.
        </p>

        <div className="p-4 bg-[#F4F7F5] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-[#163D2B]">Exportar Todos os Meus Dados</h4>
            <p className="text-[11px] text-[#738078]">
              Baixe uma cópia dos seus dados cadastrais em formato aberto (JSON).
            </p>
          </div>
          <button
            onClick={handleDownloadMyData}
            disabled={!profile}
            className="px-4 py-2 bg-[#167C49] hover:bg-[#115D38] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
          >
            {downloadSuccess ? <Check size={14} /> : <Download size={14} />}
            <span>{downloadSuccess ? 'Arquivo Baixado!' : 'Exportar Dados'}</span>
          </button>
        </div>
      </div>

      {/* Termos e Diretrizes */}
      <div className="bg-white rounded-3xl p-6 border border-[#E5EBE7] shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-[#163D2B] font-heading flex items-center gap-2">
          <FileText size={18} className="text-[#167C49]" />
          <span>Diretrizes da Comunidade PapoBR</span>
        </h2>
        <ul className="text-xs text-[#738078] space-y-2 list-disc list-inside leading-relaxed">
          <li>Respeito mútuo: tolerância zero a assédio, racismo, discriminação e discurso de ódio.</li>
          <li>Autenticidade: prezamos por pessoas reais trocando ideias de maneira construtiva.</li>
          <li>Segurança para menores: proteção especial para crianças e adolescentes.</li>
          <li>Comércio honesto: produtos e serviços anunciados no Marketplace devem ser lícitos.</li>
        </ul>
      </div>

      {/* Informações da Plataforma */}
      <div className="bg-[#EAF5EE]/60 rounded-3xl p-5 border border-[#167C49]/20 text-xs text-[#163D2B] text-center space-y-1">
        <p className="font-bold text-[#115D38] font-heading">PapoBR — O Brasil se encontra aqui.</p>
        <p className="text-[#738078] text-[11px]">
          Versão 1.0.0 • Infraestrutura Cloud Firestore Segura • Desenvolvido com carinho para o Brasil
        </p>
      </div>
    </div>
  );
};
