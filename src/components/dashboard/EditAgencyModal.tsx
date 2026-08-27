'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Building2,
  Upload,
  Check,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Briefcase,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface EditAgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any;
  onSaved: () => Promise<void>;
}

export const EditAgencyModal: React.FC<EditAgencyModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSaved,
}) => {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [agencyName, setAgencyName] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');
  const [country, setCountry] = useState('Brasil');
  const [commissionRate, setCommissionRate] = useState('20%');
  const [specialties, setSpecialties] = useState('Alta Moda, Editorial, Fashion Week');
  const [bio, setBio] = useState('');
  const [logoUrl, setLogoUrl] = useState('/api/media/assets/images/hero_visual.jpg');

  useEffect(() => {
    if (initialData) {
      setAgencyName(initialData.basicInfo?.corporateName || initialData.corporate_name || initialData.artistic_name || 'Sua Agência Corporativa');
      setResponsibleName(initialData.basicInfo?.responsibleName || initialData.responsible_name || 'Diretoria de Casting');
      setCnpj(initialData.basicInfo?.cnpj || initialData.cnpj || '12.345.678/0001-90');
      setPhone(initialData.basicInfo?.phone || initialData.phone || '+55 11 99999-8888');
      setInstagram(initialData.qualitative?.instagram || initialData.instagram || '@suaagencia');
      setCity(initialData.basicInfo?.address?.city || initialData.address?.city || 'São Paulo');
      setState(initialData.basicInfo?.address?.state || initialData.address?.state || 'SP');
      setCountry(initialData.basicInfo?.address?.country || initialData.address?.country || 'Brasil');
      setCommissionRate(initialData.qualitative?.commissionRate || initialData.commission_rate || '20%');
      setSpecialties(
        Array.isArray(initialData.qualitative?.specialties)
          ? initialData.qualitative.specialties.join(', ')
          : initialData.specialties || 'Alta Moda, Editorial, Fashion Week'
      );
      setBio(initialData.qualitative?.bio || initialData.bio || '');
      setLogoUrl(initialData.logoUrl || '/api/media/assets/images/hero_visual.jpg');
    }
  }, [initialData]);

  if (!isOpen) return null;

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'avatars');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao enviar logo para o Cloudflare R2.');
      }
      const data = await res.json();
      if (data.url) {
        setLogoUrl(data.url);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar para o Cloudflare R2';
      console.error('[UPLOAD ERROR]:', err);
      setErrorMsg(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const payload = {
      fullName: agencyName,
      responsibleName,
      artisticName: agencyName,
      cnpj,
      phone,
      instagram,
      address: { city, state, country },
      commissionRate,
      specialties: specialties.split(',').map((s) => s.trim()).filter(Boolean),
      bio,
      logoUrl,
    };

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar alterações da agência.');
      }

      setSaveSuccess(true);
      await onSaved();
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao processar atualização';
      setErrorMsg(message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const hasLogo = Boolean(logoUrl && typeof logoUrl === 'string' && logoUrl.trim() !== '');

  return (
    <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-[#0D0D0D] border border-gold/40 w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden rounded-sm animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] bg-[#111111] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 border border-gold/40 text-gold flex items-center justify-center font-serif-lumiardi font-bold text-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-lumiardi text-lg md:text-xl text-ivory font-medium">
                Editar Dados da Agência Parceira
              </h2>
              <span className="text-[11px] font-sans text-ivory/50">
                Gerencie sua razão social, equipe de casting e modelo de comissão.
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-ivory/40 hover:text-ivory hover:bg-white/[0.06] transition-colors rounded-sm cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-sans rounded-sm">
            {errorMsg}
          </div>
        )}
        {saveSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs font-sans flex items-center gap-2 rounded-sm">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Dados da agência salvos com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Logo Corporativa */}
          <div className="p-4 bg-[#141414] border border-gold/30 rounded-sm flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-24 h-24 border-2 border-gold/60 p-1 bg-black shrink-0 rounded-sm overflow-hidden group">
              {hasLogo ? (
                logoUrl.startsWith('data:') ? (
                  <img
                    src={logoUrl}
                    alt="Logo da Agência"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={logoUrl}
                    alt="Logo da Agência"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#181818] text-gold font-serif-lumiardi text-lg font-bold">
                  <Building2 className="w-6 h-6 mb-1 opacity-70" />
                  <span className="text-[9px] font-sans font-normal text-gold/80">+ Logo</span>
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-gold cursor-pointer transition-opacity">
                <Camera className="w-4 h-4 mb-1" />
                <span>Trocar Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-left">
              <h4 className="text-sm font-medium text-ivory">Logo / Emblema Corporativo</h4>
              <p className="text-xs text-ivory/60 font-sans leading-relaxed">
                Utilizado na sua credencial pública, convites de casting e contratos enviados aos talentos.
              </p>
              <label className="inline-flex px-3 py-1.5 bg-[#1E1E1E] hover:bg-gold hover:text-black-matte border border-gold/30 text-gold text-xs font-sans font-medium transition-colors items-center gap-1.5 rounded-sm cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload de Nova Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                Nome da Agência / Razão Social
              </label>
              <input
                type="text"
                required
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                Responsável de Casting / Contato
              </label>
              <input
                type="text"
                required
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                CNPJ / Identificação Fiscal
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                WhatsApp / Telefone Corporativo
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                Instagram Institucional (@)
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                Taxa de Comissão Padrão
              </label>
              <input
                type="text"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                placeholder="Ex: 20%"
                className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                Especialidades (separadas por vírgula)
              </label>
              <input
                type="text"
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                placeholder="Ex: Fashion Week, Editorial Internacional, Publicidade de Luxo"
                className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                Apresentação Institucional da Agência
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Apresente sua agência, mercado de atuação e histórico de elenco..."
                className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold p-3 text-xs text-ivory outline-none rounded-sm"
              />
            </div>
          </div>

          {/* Rodapé de Ações */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-sans text-ivory/60 hover:text-ivory transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="text-xs uppercase font-bold tracking-wider py-2.5 px-6 cursor-pointer shadow-lg shadow-gold/20 flex items-center gap-2"
            >
              {saving ? (
                'Salvando alterações...'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Dados Corporativos</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
