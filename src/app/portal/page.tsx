'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import {
  ShieldAlert,
  AlertTriangle,
  FileCheck,
  UploadCloud,
  CheckCircle2,
  Lock,
  Scale,
  Clock,
  Send,
  EyeOff,
  UserX,
  FileWarning,
  HelpCircle,
  Gavel,
  Shield,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

type CategoryType =
  | 'menor'
  | 'intimo_nao_consensual'
  | 'exploracao_coercao'
  | 'perfil_falso'
  | 'direito_imagem'
  | 'copyright'
  | 'fraude'
  | 'violacao_termos'
  | 'ordem_judicial';

interface ProtocolResult {
  protocol: string;
  category: string;
  priority: string;
  date: string;
  email: string;
}

export default function PortalPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('menor');
  const [personType, setPersonType] = useState('sim');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [url, setUrl] = useState('');
  const [contentId, setContentId] = useState('');
  const [username, setUsername] = useState('');
  const [approxDate, setApproxDate] = useState('');
  const [description, setDescription] = useState('');
  const [declaration, setDeclaration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<ProtocolResult | null>(null);

  // Campos específicos para Ordem Judicial
  const [judicialBody, setJudicialBody] = useState('');
  const [processNumber, setProcessNumber] = useState('');
  const [authorityName, setAuthorityName] = useState('');
  const [judicialDeadline, setJudicialDeadline] = useState('');

  const categories = [
    {
      id: 'menor',
      code: 'Categoria A',
      title: 'Menor de Idade (ECA Digital / CSAM)',
      desc: 'Suspeita de que pessoa menor de 18 anos aparece, participa ou é retratada em conteúdo sexual ou pornográfico.',
      priority: 'CRÍTICA',
      badgeColor: 'bg-red-500 text-black-matte',
      borderHover: 'hover:border-red-500',
    },
    {
      id: 'intimo_nao_consensual',
      code: 'Categoria B',
      title: 'Conteúdo Íntimo Não Consensual (NCII)',
      desc: 'Conteúdo íntimo envolvendo minha imagem ou de terceiro divulgado sem consentimento expresso.',
      priority: 'CRÍTICA / ALTA',
      badgeColor: 'bg-red-500/90 text-black-matte',
      borderHover: 'hover:border-red-500',
    },
    {
      id: 'exploracao_coercao',
      code: 'Categoria C',
      title: 'Exploração, Coerção ou Tráfico',
      desc: 'Suspeita fundamentada de violência, coerção, exploração forçada, tráfico de pessoas ou abuso.',
      priority: 'CRÍTICA',
      badgeColor: 'bg-red-500 text-black-matte',
      borderHover: 'hover:border-red-500',
    },
    {
      id: 'perfil_falso',
      code: 'Categoria D',
      title: 'Perfil Falso / Impersonação',
      desc: 'Perfil fraudulento que utiliza identidade, fotos ou dados pessoais de terceiro.',
      priority: 'ALTA',
      badgeColor: 'bg-amber-500 text-black-matte',
      borderHover: 'hover:border-amber-500',
    },
    {
      id: 'direito_imagem',
      code: 'Categoria E',
      title: 'Uso Indevido de Imagem e Voz',
      desc: 'Uso não autorizado de imagem, fotografia, vídeo, voz ou outro elemento da personalidade.',
      priority: 'ALTA',
      badgeColor: 'bg-amber-500 text-black-matte',
      borderHover: 'hover:border-amber-500',
    },
    {
      id: 'copyright',
      code: 'Categoria F',
      title: 'Direito Autoral / Violação de Copyright',
      desc: 'Material audiovisual, fotográfico ou autoral utilizado sem autorização expressa do titular dos direitos.',
      priority: 'MODERADA',
      badgeColor: 'bg-blue-500 text-black-matte',
      borderHover: 'hover:border-blue-500',
    },
    {
      id: 'fraude',
      code: 'Categoria G',
      title: 'Fraude Financeira / Documental',
      desc: 'Fraude financeira, clonagem, documento adulterado ou manipulação operacional ilícita.',
      priority: 'ALTA',
      badgeColor: 'bg-amber-500 text-black-matte',
      borderHover: 'hover:border-amber-500',
    },
    {
      id: 'violacao_termos',
      code: 'Categoria H',
      title: 'Outra Violação dos Termos de Uso',
      desc: 'Conduta ou conteúdo que viole os Termos de Uso ou políticas internas da Lumiardi.',
      priority: 'MODERADA',
      badgeColor: 'bg-gray-400 text-black-matte',
      borderHover: 'hover:border-gray-400',
    },
    {
      id: 'ordem_judicial',
      code: 'Ordem Oficial',
      title: 'Requisição de Autoridade / Ordem Judicial',
      desc: 'Comunicação oficial expedida por autoridade judiciária, policial ou regulatória competente.',
      priority: 'IMEDIATA',
      badgeColor: 'bg-purple-500 text-white',
      borderHover: 'hover:border-purple-500',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!declaration) {
      alert('Você precisa aceitar a declaração formal de veracidade das informações.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const selectedCatObj = categories.find((c) => c.id === selectedCategory);
      const randomId = Math.floor(100000 + Math.random() * 900000);
      const year = new Date().getFullYear();
      const protocolNumber = `LUM-${year}-${randomId}`;

      setSubmittedResult({
        protocol: protocolNumber,
        category: selectedCatObj?.title || 'Geral',
        priority: selectedCatObj?.priority || 'ALTA',
        date: new Date().toLocaleString('pt-BR'),
        email: email,
      });

      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  };

  const handleReset = () => {
    setSubmittedResult(null);
    setSelectedCategory('menor');
    setName('');
    setEmail('');
    setPhone('');
    setUrl('');
    setContentId('');
    setUsername('');
    setApproxDate('');
    setDescription('');
    setDeclaration(false);
    setJudicialBody('');
    setProcessNumber('');
    setAuthorityName('');
    setJudicialDeadline('');
  };

  return (
    <div className="min-h-screen bg-[#070707] text-[#F7F3EC] font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      <main className="pt-36 pb-28 max-w-5xl mx-auto px-6 md:px-12 space-y-16">
        
        {/* Cabeçalho Editorial & Notice-and-Action */}
        <header className="text-center space-y-5 border-b border-white/10 pb-12 relative">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-sans uppercase tracking-[0.3em]">
            <ShieldAlert className="w-4 h-4 stroke-[1.5]" />
            <span>Canal Formal de Notice-and-Action · Trust & Safety</span>
          </div>

          <h1 className="font-serif-lumiardi text-4xl sm:text-6xl font-light text-ivory tracking-tight leading-tight">
            Portal Lumiardi — Denúncia, Abuso e Direitos
          </h1>

          <p className="max-w-3xl mx-auto text-sm md:text-base text-ivory/70 font-light leading-relaxed">
            Utilize este canal para comunicar conteúdo ilegal, violação de direitos autorais, uso não autorizado de imagem, conteúdos envolvendo menores de idade, conteúdo íntimo não consensual, fraude ou infração das regras da Lumiardi.
          </p>

          <div className="p-4 bg-red-950/25 border border-red-500/30 rounded-lg max-w-2xl mx-auto text-xs text-red-200 text-center font-sans">
            ⚠️ <strong>Atenção:</strong> Em situações que envolvam risco iminente à integridade física ou sexual de qualquer pessoa, acione imediatamente também as autoridades policiais competentes.
          </div>
        </header>

        {/* TELA DE PROTOCOLO GERADO COM SUCESSO */}
        {submittedResult ? (
          <div className="p-8 md:p-12 bg-[#0D0D0D] border-2 border-[#C9A96B] rounded-xl space-y-8 animate-fade-in shadow-2xl">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-[#C9A96B]/15 border border-[#C9A96B] rounded-full flex items-center justify-center mx-auto text-[#C9A96B]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-serif-lumiardi text-3xl md:text-4xl text-ivory font-light">
                Denúncia Formal Registrada com Sucesso
              </h2>
              <p className="text-xs md:text-sm text-ivory/70 max-w-lg mx-auto">
                O seu chamado foi protocolado e encaminhado diretamente para o Núcleo de Trust & Safety e Compliance Legal da Lumiardi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-lg font-mono text-xs">
              <div className="space-y-1">
                <span className="text-ivory/50 uppercase tracking-widest text-[10px]">Número de Protocolo</span>
                <p className="text-base text-[#C9A96B] font-bold">{submittedResult.protocol}</p>
              </div>
              <div className="space-y-1">
                <span className="text-ivory/50 uppercase tracking-widest text-[10px]">Data e Hora do Registro</span>
                <p className="text-ivory">{submittedResult.date}</p>
              </div>
              <div className="space-y-1">
                <span className="text-ivory/50 uppercase tracking-widest text-[10px]">Categoria do Caso</span>
                <p className="text-ivory">{submittedResult.category}</p>
              </div>
              <div className="space-y-1">
                <span className="text-ivory/50 uppercase tracking-widest text-[10px]">Nível de Prioridade</span>
                <span className="inline-block px-2.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[11px] font-bold">
                  {submittedResult.priority}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs md:text-sm text-ivory/80 leading-relaxed">
              <p>
                Uma confirmação formal com os detalhes de tramitação foi enviada para o e-mail: <strong className="text-ivory font-mono">{submittedResult.email}</strong>.
              </p>
              <p className="text-ivory/60 text-xs">
                O caso seguirá o fluxo de preservação probatória, análise técnica e adoção das medidas cabíveis (remoção, desindexação, bloqueio ou escalonamento judicial).
              </p>
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 bg-[#C9A96B] text-[#0B0B0B] text-xs uppercase tracking-widest font-bold hover:bg-[#D4B87A] transition-all cursor-pointer"
              >
                Registrar Nova Comunicação
              </button>
            </div>
          </div>
        ) : (
          /* FORMULÁRIO DE NOTICE-AND-ACTION */
          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* ETAPA 1: Classificação Obrigatória */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[#C9A96B] text-xs uppercase tracking-widest font-semibold">
                <span className="w-5 h-5 rounded-full bg-[#C9A96B]/20 border border-[#C9A96B] flex items-center justify-center text-[10px]">1</span>
                <span>Selecione a Categoria da Denúncia (Obrigatório)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as CategoryType)}
                      className={`p-4 text-left border rounded-lg transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#C9A96B]/10 border-[#C9A96B] shadow-lg ring-1 ring-[#C9A96B]'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-[#C9A96B]">
                            {cat.code}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${cat.badgeColor}`}>
                            {cat.priority}
                          </span>
                        </div>
                        <h3 className="font-serif-lumiardi text-lg text-ivory font-normal leading-snug">
                          {cat.title}
                        </h3>
                      </div>
                      <p className="text-[11px] text-ivory/60 leading-relaxed font-light">
                        {cat.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ETAPA 2: Identificação do Denunciante */}
            <section className="space-y-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-[#C9A96B] text-xs uppercase tracking-widest font-semibold">
                <span className="w-5 h-5 rounded-full bg-[#C9A96B]/20 border border-[#C9A96B] flex items-center justify-center text-[10px]">2</span>
                <span>Identificação do Comunicante / Denunciante</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-ivory/80 uppercase tracking-wider">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/15 text-ivory text-sm rounded focus:outline-none focus:border-[#C9A96B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-ivory/80 uppercase tracking-wider">E-mail para Notificações *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@dominio.com"
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/15 text-ivory text-sm rounded focus:outline-none focus:border-[#C9A96B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-ivory/80 uppercase tracking-wider">Telefone com DDD (Opcional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/15 text-ivory text-sm rounded focus:outline-none focus:border-[#C9A96B]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-ivory/80 uppercase tracking-wider block">
                  Qual é a sua relação com a pessoa ou direito indicado? *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                  {[
                    { id: 'sim', label: 'Sou a própria pessoa retratada' },
                    { id: 'nao', label: 'Terceiro / Testemunha' },
                    { id: 'rep_legal', label: 'Sou Representante Legal' },
                    { id: 'procurador', label: 'Sou Procurador / Advogado' },
                    { id: 'resp_legal', label: 'Responsável Legal' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setPersonType(item.id)}
                      className={`p-2.5 text-center border rounded transition-all cursor-pointer ${
                        personType === item.id
                          ? 'bg-[#C9A96B]/20 border-[#C9A96B] text-ivory font-medium'
                          : 'bg-white/5 border-white/10 text-ivory/60 hover:text-ivory'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* SEÇÃO EXTRA PARA ORDEM JUDICIAL / AUTORIDADE */}
            {selectedCategory === 'ordem_judicial' && (
              <section className="p-6 bg-purple-950/20 border border-purple-500/40 rounded-lg space-y-4">
                <div className="flex items-center gap-2 text-purple-300 text-xs uppercase tracking-widest font-semibold">
                  <Gavel className="w-4 h-4" />
                  <span>Dados Específicos da Requisição de Autoridade / Mandado</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-ivory/70 uppercase">Órgão / Vara Judicial *</label>
                    <input
                      type="text"
                      required
                      value={judicialBody}
                      onChange={(e) => setJudicialBody(e.target.value)}
                      placeholder="Ex: 3ª Vara Criminal de SP"
                      className="w-full p-2.5 bg-[#0D0D0D] border border-white/20 rounded text-ivory"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-ivory/70 uppercase">Número do Processo / Ofício *</label>
                    <input
                      type="text"
                      required
                      value={processNumber}
                      onChange={(e) => setProcessNumber(e.target.value)}
                      placeholder="0000000-00.2026.8.00.0000"
                      className="w-full p-2.5 bg-[#0D0D0D] border border-white/20 rounded text-ivory"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-ivory/70 uppercase">Autoridade Subscritora *</label>
                    <input
                      type="text"
                      required
                      value={authorityName}
                      onChange={(e) => setAuthorityName(e.target.value)}
                      placeholder="Nome do Magistrado ou Delegado"
                      className="w-full p-2.5 bg-[#0D0D0D] border border-white/20 rounded text-ivory"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-ivory/70 uppercase">Prazo Determinado</label>
                    <input
                      type="text"
                      value={judicialDeadline}
                      onChange={(e) => setJudicialDeadline(e.target.value)}
                      placeholder="Ex: 24 horas / Imediato"
                      className="w-full p-2.5 bg-[#0D0D0D] border border-white/20 rounded text-ivory"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* ETAPA 3: Identificação do Conteúdo */}
            <section className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-[#C9A96B] text-xs uppercase tracking-widest font-semibold">
                <span className="w-5 h-5 rounded-full bg-[#C9A96B]/20 border border-[#C9A96B] flex items-center justify-center text-[10px]">3</span>
                <span>Identificação do Conteúdo Alvo</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs text-ivory/80 uppercase tracking-wider">URL / Link Direto do Conteúdo ou Perfil *</label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://lumiardi.com/..."
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/15 text-ivory text-sm rounded focus:outline-none focus:border-[#C9A96B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-ivory/80 uppercase tracking-wider">ID ou Nome de Usuário</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@usuario ou ID"
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-white/15 text-ivory text-sm rounded focus:outline-none focus:border-[#C9A96B]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-ivory/80 uppercase tracking-wider">
                  Descrição Objetiva dos Fatos e Violação Alegada *
                </label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva com clareza a violação identificada, datas aproximadas, contexto da ausência de consentimento ou elementos que comprovem a titularidade dos direitos..."
                  className="w-full p-4 bg-[#0D0D0D] border border-white/15 text-ivory text-sm rounded focus:outline-none focus:border-[#C9A96B] leading-relaxed font-sans"
                />
              </div>
            </section>

            {/* ETAPA 4: Regra Crítica de Provas & Alerta Protetivo */}
            <section className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-[#C9A96B] text-xs uppercase tracking-widest font-semibold">
                <span className="w-5 h-5 rounded-full bg-[#C9A96B]/20 border border-[#C9A96B] flex items-center justify-center text-[10px]">4</span>
                <span>Diretrizes para Apresentação de Provas e Documentos</span>
              </div>

              {/* Alerta Protetivo Obrigatório */}
              <div className="p-6 bg-amber-950/20 border border-amber-500/40 rounded-lg space-y-3 text-amber-200 text-xs md:text-sm">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-300">
                  <FileWarning className="w-5 h-5 shrink-0" />
                  <span>Regra Crítica Protetiva para Uploads</span>
                </div>
                <p className="leading-relaxed">
                  <strong>NÃO envie conteúdo sexual envolvendo menor de idade</strong> ou arquivos contendo material ilícito desnecessário à análise. Quando possível, forneça somente a URL, identificação do conteúdo, capturas de tela dos metadados e informações suficientes para localização técnica.
                </p>
              </div>

              <div className="p-6 border border-dashed border-white/20 rounded-lg text-center space-y-3 bg-white/[0.01]">
                <UploadCloud className="w-8 h-8 text-ivory/40 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs text-ivory/80">
                    Insira links para documentos comprobatórios, procurações ou titularidades no campo de descrição acima.
                  </p>
                  <p className="text-[11px] text-ivory/50">
                    Formatos aceitos para análise documental complementar via e-mail: PDF, PNG, JPG até 15MB.
                  </p>
                </div>
              </div>
            </section>

            {/* ETAPA 5: Declaração Formal de Responsabilidade */}
            <section className="space-y-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-[#C9A96B] text-xs uppercase tracking-widest font-semibold">
                <span className="w-5 h-5 rounded-full bg-[#C9A96B]/20 border border-[#C9A96B] flex items-center justify-center text-[10px]">5</span>
                <span>Declaração Formal de Responsabilidade</span>
              </div>

              <label className="p-4 bg-white/[0.02] border border-white/15 rounded-lg flex items-start gap-3.5 cursor-pointer hover:border-[#C9A96B]/50 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={declaration}
                  onChange={(e) => setDeclaration(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#C9A96B] rounded cursor-pointer"
                />
                <span className="text-xs md:text-sm text-ivory/90 leading-relaxed">
                  <strong>Declaro, sob as penas da lei e sob minha responsabilidade</strong>, que as informações e documentos aqui fornecidos são verdadeiros segundo meu melhor conhecimento e que estou comunicando formalmente uma situação que considero relevante para a segurança, proteção de direitos ou cumprimento das regras e termos da plataforma Lumiardi.
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-[#C9A96B] text-[#0B0B0B] text-xs md:text-sm font-sans tracking-[0.25em] uppercase font-bold hover:bg-[#D4B87A] transition-all flex items-center justify-center gap-3 shadow-xl cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Gerando Protocolo Oficial...' : 'Enviar Denúncia Formal →'}</span>
              </button>
            </section>
          </form>
        )}

        {/* SEÇÕES DE GOVERNANÇA, SLA E TRANSPARÊNCIA */}
        <section className="pt-16 border-t border-white/10 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A96B]">Governança & Compliance</span>
            <h2 className="font-serif-lumiardi text-3xl md:text-4xl font-light text-ivory">
              Estrutura Operacional e Níveis de Serviço (SLA)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-5 bg-red-950/20 border border-red-500/30 rounded-lg space-y-2">
              <span className="text-red-400 font-bold uppercase tracking-wider block">Crítico</span>
              <p className="font-mono text-ivory font-medium">Priorização Imediata</p>
              <p className="text-ivory/60 leading-relaxed">Casos de menor de idade (CSAM), risco físico iminente, coerção ou conteúdo íntimo grave.</p>
            </div>

            <div className="p-5 bg-amber-950/20 border border-amber-500/30 rounded-lg space-y-2">
              <span className="text-amber-400 font-bold uppercase tracking-wider block">Alto</span>
              <p className="font-mono text-ivory font-medium">Até 24 horas</p>
              <p className="text-ivory/60 leading-relaxed">Direito de imagem da pessoa retratada, impersonação e fraudes financeiras ativas.</p>
            </div>

            <div className="p-5 bg-blue-950/20 border border-blue-500/30 rounded-lg space-y-2">
              <span className="text-blue-400 font-bold uppercase tracking-wider block">Moderado</span>
              <p className="font-mono text-ivory font-medium">Até 3 dias úteis</p>
              <p className="text-ivory/60 leading-relaxed">Disputas de direito autoral (Copyright/DMCA) e violações operacionais de regras.</p>
            </div>

            <div className="p-5 bg-white/[0.02] border border-white/10 rounded-lg space-y-2">
              <span className="text-ivory/60 font-bold uppercase tracking-wider block">Ordinário</span>
              <p className="font-mono text-ivory font-medium">Até 5 dias úteis</p>
              <p className="text-ivory/60 leading-relaxed">Dúvidas regulatórias gerais, pedidos de esclarecimento e recursos procedimentais.</p>
            </div>
          </div>

          {/* Princípio de Governança Documental */}
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-lg space-y-3 text-xs md:text-sm text-ivory/80 leading-relaxed">
            <h3 className="font-serif-lumiardi text-xl text-[#C9A96B] font-normal">
              Princípio Fundamental de Notice-and-Action da Lumiardi
            </h3>
            <p>
              A Lumiardi opera com rastreabilidade integral em cadeia auditável:
            </p>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#C9A96B] pt-2">
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded">1. Recebimento</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded">2. Triagem e Classificação</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded">3. Preservação Probatória</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded">4. Análise Legal/Técnica</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded">5. Decisão e Medida Cautelar</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded">6. Comunicação e Registro</span>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
