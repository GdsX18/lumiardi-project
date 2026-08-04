'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Building2, ShieldCheck, Upload, CheckCircle2, Lock, ArrowRight, FileText } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function AgenciaQualificacaoPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    cnpj: '',
    companyName: '',
    tradingName: '',
    country: 'Brasil',
    city: 'São Paulo',
    responsibleName: '',
    corporateEmail: '',
    phone: '',
    talentCount: '10-50',
    docUploaded: false,
    acceptedTerms: false,
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-ivory font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      {/* Hero da Página de Cadastro de Agência */}
      <section className="pt-36 pb-16 bg-[#0B0B0B] border-b border-[#C9A96B]/30 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C9A96B]/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center px-6 space-y-6 relative z-10">
          <Badge variant="gold">ONBOARDING CORPORATIVO DE ELITE</Badge>

          <h1 className="font-serif-lumiardi text-4xl sm:text-6xl font-light text-ivory tracking-tight">
            Cadastro e Qualificação de Agências
          </h1>

          <p className="text-base sm:text-lg text-ivory/70 font-sans max-w-2xl mx-auto font-light leading-relaxed">
            Submeta as informações da sua agência para análise de curadoria. Garantimos compliance contratual, verificação de idoneidade e sigilo absoluto.
          </p>

          {/* Stepper Visual */}
          <div className="flex items-center justify-center gap-4 pt-6 text-xs uppercase tracking-widest font-sans">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#C9A96B]' : 'text-ivory/40'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 1 ? 'border-[#C9A96B] bg-[#C9A96B]/20' : 'border-white/20'}`}>1</span>
              <span>Dados Corporativos</span>
            </div>
            <span className="text-ivory/30">&mdash;</span>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#C9A96B]' : 'text-ivory/40'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 2 ? 'border-[#C9A96B] bg-[#C9A96B]/20' : 'border-white/20'}`}>2</span>
              <span>Responsável</span>
            </div>
            <span className="text-ivory/30">&mdash;</span>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#C9A96B]' : 'text-ivory/40'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 3 ? 'border-[#C9A96B] bg-[#C9A96B]/20' : 'border-white/20'}`}>3</span>
              <span>Documentação</span>
            </div>
          </div>
        </div>
      </section>

      {/* Form Container */}
      <section className="py-20 bg-[#F7F3EC] text-[#0B0B0B]">
        <div className="max-w-3xl mx-auto px-6">
          {submitted ? (
            <div className="bg-white border-2 border-[#C9A96B] p-10 md:p-14 text-center space-y-6 shadow-2xl animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-[#C9A96B]/20 text-[#8C6B2F] rounded-full flex items-center justify-center mx-auto border border-[#C9A96B]">
                <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h2 className="font-serif-lumiardi text-3xl md:text-4xl font-light text-[#0B0B0B]">
                Cadastro Enviado para Curadoria Lumiardi
              </h2>
              <p className="text-sm text-[#0B0B0B]/75 font-sans leading-relaxed max-w-xl mx-auto">
                Agradecemos a submissão dos dados corporativos. Nossa equipe de compliance efetuará a análise cadastral e entrará em contato através do e-mail corporativo fornecido em até 24 horas úteis.
              </p>
              <div className="pt-6 border-t border-[#0B0B0B]/10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="primary"
                  onClick={() => router.push('/dashboard')}
                >
                  Testar Painel Simulado
                </Button>
                <Button
                  variant="outline-dark"
                  onClick={() => router.push('/')}
                >
                  Voltar para a Home
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-[#0B0B0B]/10 p-8 md:p-12 shadow-2xl space-y-8">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-[#0B0B0B]/10 pb-4">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6B2F] font-sans font-semibold">Etapa 01 de 03</span>
                    <h3 className="font-serif-lumiardi text-2xl font-normal text-[#0B0B0B] mt-1">Identificação da Empresa</h3>
                  </div>

                  <div className="space-y-4 text-xs font-sans">
                    <div>
                      <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">Razão Social *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Aura Management Ltda"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">Nome Fantasia *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Aura Management"
                          value={formData.tradingName}
                          onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">CNPJ / ID Fiscal *</label>
                        <input
                          type="text"
                          required
                          placeholder="00.000.000/0001-00"
                          value={formData.cnpj}
                          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">País de Sede *</label>
                        <input
                          type="text"
                          required
                          placeholder="Brasil"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">Cidade Principal *</label>
                        <input
                          type="text"
                          required
                          placeholder="São Paulo"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-8 py-3.5 bg-[#0B0B0B] text-ivory text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#8C6B2F] transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>Avançar para Responsável</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-[#0B0B0B]/10 pb-4">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6B2F] font-sans font-semibold">Etapa 02 de 03</span>
                    <h3 className="font-serif-lumiardi text-2xl font-normal text-[#0B0B0B] mt-1">Contato do Responsável Legal</h3>
                  </div>

                  <div className="space-y-4 text-xs font-sans">
                    <div>
                      <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">Nome Completo do Responsável *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Carlos Eduardo Silva"
                        value={formData.responsibleName}
                        onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                        className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">E-mail Corporativo *</label>
                        <input
                          type="email"
                          required
                          placeholder="contato@agenciaaura.com"
                          value={formData.corporateEmail}
                          onChange={(e) => setFormData({ ...formData, corporateEmail: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">Telefone / WhatsApp *</label>
                        <input
                          type="text"
                          required
                          placeholder="+55 (11) 99999-8888"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">Estimativa de Talentos sob Gestão</label>
                      <select
                        value={formData.talentCount}
                        onChange={(e) => setFormData({ ...formData, talentCount: e.target.value })}
                        className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2]"
                      >
                        <option value="1-10">1 a 10 Talentos</option>
                        <option value="10-50">10 a 50 Talentos</option>
                        <option value="50+">Mais de 50 Talentos</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-3.5 border border-[#0B0B0B]/20 text-xs uppercase tracking-[0.2em] font-medium hover:border-[#0B0B0B] transition-colors cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-8 py-3.5 bg-[#0B0B0B] text-ivory text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#8C6B2F] transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>Avançar para Documentação</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-[#0B0B0B]/10 pb-4">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6B2F] font-sans font-semibold">Etapa 03 de 03</span>
                    <h3 className="font-serif-lumiardi text-2xl font-normal text-[#0B0B0B] mt-1">Anexo de Documentação & Compliance</h3>
                  </div>

                  <div className="p-6 bg-[#FAF7F2] border border-[#0B0B0B]/10 space-y-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-[#8C6B2F] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-serif-lumiardi text-lg text-[#0B0B0B]">Contrato Social / Comprovante de ID Fiscal</h4>
                        <p className="text-xs text-[#0B0B0B]/70 font-sans mt-0.5">Envie documento em formato PDF ou JPG comprovando a existência da empresa para verificação.</p>
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-[#0B0B0B]/20 p-6 text-center bg-white space-y-2">
                      <Upload className="w-6 h-6 text-[#8C6B2F] mx-auto" />
                      <span className="block text-xs font-sans text-[#0B0B0B]/70 font-medium">Clique para selecionar o arquivo (PDF, PNG ou JPG)</span>
                      <span className="block text-[10px] text-[#0B0B0B]/50 font-sans">Tamanho máximo: 15MB</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, docUploaded: true })}
                        className="mt-2 px-4 py-1.5 bg-[#C9A96B]/20 text-[#8C6B2F] border border-[#C9A96B]/40 text-xs font-sans uppercase font-medium hover:bg-[#C9A96B]/30 cursor-pointer"
                      >
                        {formData.docUploaded ? 'Documento Anexado ✓' : 'Simular Upload de Documento'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs font-sans text-[#0B0B0B]/80 pt-2">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      checked={formData.acceptedTerms}
                      onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                      className="mt-0.5"
                    />
                    <label htmlFor="terms" className="cursor-pointer">
                      Declaramos que as informações prestadas são verdadeiras e concordamos com os <strong>Termos de Sigilo, Privacidade e Curadoria Lumiardi</strong>.
                    </label>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-6 py-3.5 border border-[#0B0B0B]/20 text-xs uppercase tracking-[0.2em] font-medium hover:border-[#0B0B0B] transition-colors cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-[#C9A96B] text-[#0B0B0B] text-xs uppercase tracking-[0.25em] font-semibold hover:bg-[#D4B87A] transition-colors flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Submeter para Curadoria</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
