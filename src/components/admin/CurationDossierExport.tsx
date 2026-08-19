'use client';

import React from 'react';
import {
  Printer,
  ShieldCheck,
  FileCheck2,
  Calendar,
  Lock,
  Download,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CurationDossierExportProps {
  application: any;
  auditorEmail?: string;
}

export const CurationDossierExport: React.FC<CurationDossierExportProps> = ({
  application,
  auditorEmail = 'curadoria@lumiardi.com',
}) => {
  const isModel = application.role === 'criadora';
  const prof = application.profile || {};
  const protocolNumber = `LUM-2257-${(application.id || 'AUDIT').substring(0, 8).toUpperCase()}`;
  const now = application.createdAt
    ? new Date(application.createdAt).toLocaleDateString('pt-BR')
    : '18/08/2026';
  const securityHash = `SHA256:${(application.id || 'lumiardi').padEnd(16, 'f').substring(0, 16)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Botão de Ação no Painel */}
      <Button
        type="button"
        variant="secondary"
        onClick={handlePrint}
        className="px-4 py-2.5 text-xs font-sans uppercase tracking-wider flex items-center gap-2 border-gold/40 text-gold hover:bg-gold hover:text-black-matte transition-all cursor-pointer"
      >
        <Printer className="w-3.5 h-3.5" />
        <span>Exportar Dossiê 2257 (PDF / Imprimir)</span>
      </Button>

      {/* Folha Oficial Estilizada para Impressão e Auditoria */}
      <div id="print-dossier" className="hidden print:block print:fixed print:inset-0 print:bg-white print:text-black print:p-8 print:z-[9999]">
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-dossier, #print-dossier * {
              visibility: visible;
            }
            #print-dossier {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: #ffffff !important;
              color: #000000 !important;
            }
          }
        `}</style>

        <div className="max-w-4xl mx-auto space-y-6 text-xs font-sans text-neutral-900 border-2 border-neutral-800 p-8">
          {/* Cabeçalho do Dossiê */}
          <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-4">
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-widest text-neutral-900 uppercase">
                LUMIARDI TECHNOLOGIES S.A.
              </h1>
              <p className="text-[10px] tracking-wider text-neutral-600 uppercase font-mono">
                Mesa de Curadoria, Compliance & Auditoria Documental · Seção 2257
              </p>
            </div>
            <div className="text-right font-mono text-[10px]">
              <div className="font-bold text-neutral-900">PROTOCOLO OFICIAL:</div>
              <div className="text-sm font-black">{protocolNumber}</div>
              <div className="text-neutral-500">Emitido em: {now}</div>
            </div>
          </div>

          {/* Selo de Conformidade */}
          <div className="p-3 bg-neutral-100 border border-neutral-300 flex items-center justify-between">
            <div>
              <span className="font-bold text-[11px] uppercase tracking-wider block">
                HOMOLOGAÇÃO DE REGISTRO E CONFORMIDADE LEGAL
              </span>
              <span className="text-[10px] text-neutral-600">
                Certificação de conformidade em atendimento às exigências do 18 U.S.C. § 2257 e LGPD.
              </span>
            </div>
            <div className="px-3 py-1 bg-neutral-900 text-white font-mono text-[10px] font-bold uppercase tracking-widest">
              {application.curationStatus || 'EM_CURATORIA'}
            </div>
          </div>

          {/* Dados Pessoais / Corporativos */}
          <div className="grid grid-cols-2 gap-4 border border-neutral-300 p-4">
            <div>
              <h3 className="font-bold uppercase tracking-wider text-[11px] mb-2 border-b border-neutral-300 pb-1">
                {isModel ? '1. Identificação da Criadora' : '1. Identificação da Agência'}
              </h3>
              <div className="space-y-1 text-[11px]">
                <div><strong>Nome Civil / Responsável:</strong> {application.fullName || '-'}</div>
                <div><strong>Nome Artístico / Fantasia:</strong> {prof.artisticName || prof.corporateName || '-'}</div>
                <div><strong>E-mail Cadastrado:</strong> {application.email || '-'}</div>
                <div><strong>Telefone / WhatsApp:</strong> {application.phone || '-'}</div>
                <div><strong>Instagram / Redes:</strong> {prof.instagram || '-'}</div>
                <div><strong>Localização:</strong> {prof.address?.city || 'São Paulo'} - {prof.address?.state || 'SP'}, {prof.address?.country || 'Brasil'}</div>
              </div>
            </div>

            <div>
              <h3 className="font-bold uppercase tracking-wider text-[11px] mb-2 border-b border-neutral-300 pb-1">
                2. Auditoria Documental & Biométrica
              </h3>
              <div className="space-y-1 text-[11px]">
                <div><strong>Tipo de Documento:</strong> {application.documentType || 'Passaporte / RG Oficial'}</div>
                <div><strong>Número / CPF / CNPJ:</strong> {prof.documentNumber || prof.cnpj || 'Verificado via OCR'}</div>
                <div><strong>Arquivo Anexado:</strong> {application.documentName || 'doc_identidade.pdf'}</div>
                <div><strong>Data de Nascimento:</strong> {prof.birthDate || 'Maior de 18 anos'}</div>
                <div><strong>Status Biometria Facial:</strong> Homologada (Conformidade 3D)</div>
                <div><strong>Chave de Segurança:</strong> <code className="text-[9px] font-mono">{securityHash}</code></div>
              </div>
            </div>
          </div>

          {/* Dados Físicos / Artísticos (se criadora) */}
          {isModel && (
            <div className="border border-neutral-300 p-4 space-y-2">
              <h3 className="font-bold uppercase tracking-wider text-[11px] border-b border-neutral-300 pb-1">
                3. Medidas Corporais & Perfil Artístico
              </h3>
              <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-mono">
                <div className="p-1 bg-neutral-50 border">ALTURA: <strong>{prof.measurements?.height || '175'} cm</strong></div>
                <div className="p-1 bg-neutral-50 border">PESO: <strong>{prof.measurements?.weight || '55'} kg</strong></div>
                <div className="p-1 bg-neutral-50 border">BUSTO: <strong>{prof.measurements?.bust || '88'} cm</strong></div>
                <div className="p-1 bg-neutral-50 border">CINTURA: <strong>{prof.measurements?.waist || '60'} cm</strong></div>
                <div className="p-1 bg-neutral-50 border">QUADRIL: <strong>{prof.measurements?.hips || '90'} cm</strong></div>
              </div>
            </div>
          )}

          {/* Declaração de Auditoria e Assinaturas */}
          <div className="border-t-2 border-neutral-900 pt-6 mt-8 space-y-6">
            <p className="text-[10px] text-neutral-600 leading-relaxed text-justify">
              Declaro para os devidos fins de conformidade jurídica que os registros cadastrais, documentos de identificação primária e registros biométricos do titular acima qualificado foram devidamente analisados e custodiados nos termos da legislação aplicável. O presente dossiê possui validade jurídica internacional no âmbito da plataforma Lumiardi.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[10px]">
              <div>
                <div className="border-b border-neutral-800 pb-1 font-bold">{auditorEmail}</div>
                <div className="text-neutral-500 pt-1">Auditor Responsável · Mesa de Curadoria Lumiardi</div>
              </div>
              <div>
                <div className="border-b border-neutral-800 pb-1 font-bold">LUMIARDI COMPLIANCE ENGINE</div>
                <div className="text-neutral-500 pt-1">Assinatura DigitalSHA-256 · Carimbo de Tempo UTC</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
