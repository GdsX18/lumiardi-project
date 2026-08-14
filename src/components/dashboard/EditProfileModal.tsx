'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  X,
  Camera,
  Upload,
  Plus,
  Trash2,
  Check,
  Sliders,
  Play,
  FileText,
  ShieldCheck,
  DollarSign,
  Globe,
  MapPin,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any;
  onSaved: () => Promise<void>;
  defaultTab?: 'basic' | 'book' | 'video' | 'measurements' | 'limits';
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSaved,
  defaultTab = 'basic',
}) => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'book' | 'video' | 'measurements' | 'limits'>(defaultTab);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Estados dos Campos
  const [artisticName, setArtisticName] = useState('');
  const [category, setCategory] = useState('');
  const [instagram, setInstagram] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [avatarUrl, setAvatarUrl] = useState('/images/creator_elena.jpg');
  const [bio, setBio] = useState('');

  // Fotos do Book
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; title: string; tag: string }>>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoTag, setNewPhotoTag] = useState('Alta Resolução · RAW');

  // Vídeo Showreel
  const [videoUrl, setVideoUrl] = useState('');

  // Medidas Corporais
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('55');
  const [waist, setWaist] = useState('60');
  const [bust, setBust] = useState('88');
  const [hips, setHips] = useState('90');
  const [eyeColor, setEyeColor] = useState('Castanhos');
  const [hairColor, setHairColor] = useState('Natural');
  const [skinTone, setSkinTone] = useState('Clara');
  const [languages, setLanguages] = useState('Português, Inglês');

  // Diretrizes & Negócio
  const [monthlyRevenueEstimate, setMonthlyRevenueEstimate] = useState('Sob Consulta');
  const [personalLimits, setPersonalLimits] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [exposureOpinion, setExposureOpinion] = useState('');

  useEffect(() => {
    if (initialData) {
      setArtisticName(initialData.qualitative?.artisticName || initialData.artistic_name || 'Sua Conta Modelo');
      setCategory(initialData.qualitative?.category || initialData.category || 'Modelo & Criadora VIP');
      setInstagram(initialData.qualitative?.platforms?.instagram || initialData.instagram || '@suaconta');
      setCity(initialData.basicInfo?.address?.city || initialData.address?.city || 'São Paulo');
      setState(initialData.basicInfo?.address?.state || initialData.address?.state || 'SP');
      setCountry(initialData.basicInfo?.address?.country || initialData.address?.country || 'Brasil');
      setAvatarUrl(initialData.avatarUrl || initialData.photos?.[0]?.url || '/images/creator_elena.jpg');
      setBio(initialData.qualitative?.bio || initialData.bio || '');

      const initialPhotos = initialData.photos || initialData.qualitative?.photos || [
        {
          id: '1',
          url: '/images/creator_elena.jpg',
          title: 'Editorial Haute Couture - Milan Issue',
          tag: 'Alta Resolução · RAW',
        },
        {
          id: '2',
          url: '/images/creator_sophia.jpg',
          title: 'Studio Lighting Portrait 01',
          tag: 'Book Oficial 2026',
        },
        {
          id: '3',
          url: '/images/hero_visual.jpg',
          title: 'Cinematic Atmosphere Reel Still',
          tag: 'Vídeo Highlight',
        },
      ];
      setPhotos(initialPhotos);

      setVideoUrl(initialData.videoUrl || initialData.qualitative?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');

      const meas = initialData.qualitative?.measurements || initialData.measurements || {};
      setHeight(meas.height || '175');
      setWeight(meas.weight || '55');
      setWaist(meas.waist || '60');
      setBust(meas.bust || '88');
      setHips(meas.hips || '90');

      const phys = initialData.qualitative?.physiognomy || {};
      setEyeColor(phys.eyeColor || 'Castanhos');
      setHairColor(phys.hairColor || 'Natural');
      setSkinTone(phys.skinTone || 'Clara');
      setLanguages(Array.isArray(phys.languages) ? phys.languages.join(', ') : 'Português, Inglês');

      setMonthlyRevenueEstimate(initialData.qualitative?.monthlyRevenueEstimate || initialData.monthly_revenue_estimate || 'Sob Consulta');
      setPersonalLimits(initialData.qualitative?.personalLimits || initialData.exposure_opinion || 'Preservação de imagem e contratos sob curadoria exclusiva.');
      setMainGoal(initialData.qualitative?.mainGoal || 'Conectar com agências internacionais de prestígio.');
      setExposureOpinion(initialData.qualitative?.exposureOpinion || 'Posicionamento exclusivo e elegante.');
    }
  }, [initialData]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  if (!isOpen) return null;

  // Adicionar foto ao Book
  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    const newEntry = {
      id: `photo-${Date.now()}`,
      url: newPhotoUrl.trim(),
      title: newPhotoTitle.trim() || `Ensaio ${photos.length + 1}`,
      tag: newPhotoTag || 'Alta Resolução',
    };
    setPhotos([...photos, newEntry]);
    setNewPhotoUrl('');
    setNewPhotoTitle('');
  };

  // Remover foto do Book
  const handleRemovePhoto = (id: string) => {
    setPhotos(photos.filter((p) => p.id !== id));
  };

  // Upload real via /api/upload com fallback local
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'photo' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          if (target === 'avatar') {
            setAvatarUrl(data.url);
          } else if (target === 'photo') {
            setNewPhotoUrl(data.url);
            if (!newPhotoTitle) {
              setNewPhotoTitle(file.name.replace(/\.[^/.]+$/, ''));
            }
          } else if (target === 'video') {
            setVideoUrl(data.url);
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Fallback local para upload:', err);
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        if (target === 'avatar') {
          setAvatarUrl(reader.result);
        } else if (target === 'photo') {
          setNewPhotoUrl(reader.result);
          if (!newPhotoTitle) {
            setNewPhotoTitle(file.name.replace(/\.[^/.]+$/, ''));
          }
        } else if (target === 'video') {
          setVideoUrl(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Submissão
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const payload = {
      artisticName,
      category,
      instagram,
      avatarUrl,
      bio,
      address: { city, state, country },
      photos,
      videoUrl,
      measurements: { height, weight, waist, bust, hips },
      physiognomy: {
        eyeColor,
        hairColor,
        skinTone,
        languages: languages.split(',').map((l) => l.trim()).filter(Boolean),
      },
      monthlyRevenueEstimate,
      personalLimits,
      mainGoal,
      exposureOpinion,
    };

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar alterações.');
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

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-[#0D0D0D] border border-gold/40 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden rounded-sm animate-scaleIn">
        {/* Header do Modal */}
        <div className="px-6 py-4 border-b border-white/[0.08] bg-[#111111] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 border border-gold/40 text-gold flex items-center justify-center font-serif-lumiardi font-bold text-sm">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-lumiardi text-lg md:text-xl text-ivory font-medium">
                Gerenciador de Book & Perfil da Modelo
              </h2>
              <span className="text-[11px] font-sans text-ivory/50">
                Edite suas fotos profissionais, biometria e informações de apresentação.
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

        {/* Abas de Navegação Interna */}
        <div className="flex border-b border-white/[0.08] bg-[#0A0A0A] px-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-3 text-xs font-sans uppercase tracking-widest font-medium transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'basic'
                ? 'border-gold text-gold bg-gold/10 font-bold'
                : 'border-transparent text-ivory/60 hover:text-ivory'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>1. Foto & Identidade</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('book')}
            className={`px-4 py-3 text-xs font-sans uppercase tracking-widest font-medium transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'book'
                ? 'border-gold text-gold bg-gold/10 font-bold'
                : 'border-transparent text-ivory/60 hover:text-ivory'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Fotos do Book ({photos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`px-4 py-3 text-xs font-sans uppercase tracking-widest font-medium transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'video'
                ? 'border-gold text-gold bg-gold/10 font-bold'
                : 'border-transparent text-ivory/60 hover:text-ivory'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>3. Vídeo Showreel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('measurements')}
            className={`px-4 py-3 text-xs font-sans uppercase tracking-widest font-medium transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'measurements'
                ? 'border-gold text-gold bg-gold/10 font-bold'
                : 'border-transparent text-ivory/60 hover:text-ivory'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>4. Ficha Técnica & Medidas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('limits')}
            className={`px-4 py-3 text-xs font-sans uppercase tracking-widest font-medium transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'limits'
                ? 'border-gold text-gold bg-gold/10 font-bold'
                : 'border-transparent text-ivory/60 hover:text-ivory'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>5. Diretrizes & Negócio</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-sans rounded-sm">
            {errorMsg}
          </div>
        )}
        {saveSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs font-sans flex items-center gap-2 rounded-sm">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Informações atualizadas com sucesso no ecossistema!</span>
          </div>
        )}

        {/* Formulário com Scroll */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ABA 1: Identidade & Foto Principal */}
          {activeTab === 'basic' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Foto Principal / Avatar */}
              <div className="p-4 bg-[#141414] border border-gold/30 rounded-sm flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-28 h-28 border-2 border-gold/60 p-1 bg-black shrink-0 rounded-sm overflow-hidden group">
                  <Image
                    src={avatarUrl}
                    alt="Foto de Perfil"
                    fill
                    className="object-cover"
                  />
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-gold cursor-pointer transition-opacity">
                    <Camera className="w-5 h-5 mb-1" />
                    <span>Trocar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'avatar')}
                    />
                  </label>
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <h4 className="text-sm font-medium text-ivory">Foto Principal do Perfil</h4>
                  <p className="text-xs text-ivory/60 font-sans leading-relaxed">
                    Esta imagem é exibida no catálogo de agências, no casting internacional e no topo do seu Book oficial.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                    <label className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-gold hover:text-black-matte border border-gold/30 text-gold text-xs font-sans font-medium transition-colors flex items-center gap-1.5 rounded-sm cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload de Arquivo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'avatar')}
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Ou cole a URL da imagem..."
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="bg-[#181818] border border-white/[0.1] px-3 py-1.5 text-xs text-ivory outline-none rounded-sm flex-1 min-w-[200px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                    Nome Artístico / Nome de Apresentação
                  </label>
                  <input
                    type="text"
                    required
                    value={artisticName}
                    onChange={(e) => setArtisticName(e.target.value)}
                    className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                    Categoria Artística
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-sm"
                  >
                    <option value="Modelo & Criadora VIP">Modelo & Criadora VIP</option>
                    <option value="Alta Moda & Editorial">Alta Moda & Editorial</option>
                    <option value="Comercial & Publicidade">Comercial & Publicidade</option>
                    <option value="Passarela Internacional">Passarela Internacional</option>
                    <option value="Fitness & Lingerie de Luxo">Fitness & Lingerie de Luxo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                    Instagram Profissional (@)
                  </label>
                  <input
                    type="text"
                    required
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                      Estado (UF)
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                    Biografia / Apresentação Profissional
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Conte sobre sua trajetória, experiência editorial e objetivos..."
                    className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold p-3 text-xs text-ivory outline-none rounded-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: Galeria do Book Fotográfico */}
          {activeTab === 'book' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Adicionar nova foto */}
              <div className="p-4 bg-[#141414] border border-gold/30 rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gold flex items-center gap-1.5 uppercase tracking-wider">
                    <Plus className="w-4 h-4" /> Adicionar Novo Ensaio ao Book
                  </span>
                  <span className="text-[10px] text-ivory/40 font-sans">
                    Formatos: JPG, PNG, WEBP ou RAW
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Título do ensaio (Ex: Editorial Paris)"
                      value={newPhotoTitle}
                      onChange={(e) => setNewPhotoTitle(e.target.value)}
                      className="w-full bg-[#181818] border border-white/[0.1] px-3 py-2 text-xs text-ivory outline-none rounded-sm"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Tag (Ex: Alta Resolução · RAW)"
                      value={newPhotoTag}
                      onChange={(e) => setNewPhotoTag(e.target.value)}
                      className="w-full bg-[#181818] border border-white/[0.1] px-3 py-2 text-xs text-ivory outline-none rounded-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="URL da Imagem..."
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      className="w-full bg-[#181818] border border-white/[0.1] px-3 py-2 text-xs text-ivory outline-none rounded-sm"
                    />
                    <label className="p-2 bg-[#202020] hover:bg-gold hover:text-black-matte border border-white/10 text-gold text-xs transition-colors rounded-sm cursor-pointer shrink-0" title="Upload de Arquivo">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'photo')}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    disabled={!newPhotoUrl.trim()}
                    className="px-4 py-2 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs uppercase tracking-wider rounded-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    + Incluir na Galeria
                  </button>
                </div>
              </div>

              {/* Lista de Fotos Existentes */}
              <div className="space-y-2">
                <span className="text-[11px] text-ivory/70 uppercase tracking-widest font-semibold block">
                  Ensaios Cadastrados no seu Book ({photos.length})
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo, idx) => (
                    <div
                      key={photo.id || idx}
                      className="bg-[#141414] border border-white/[0.1] rounded-sm overflow-hidden group relative"
                    >
                      <div className="relative h-44 w-full bg-black">
                        <Image
                          src={photo.url}
                          alt={photo.title}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="absolute top-2 right-2 p-1.5 bg-rose-900/80 hover:bg-rose-600 text-white rounded-xs transition-colors cursor-pointer shadow-md"
                          title="Remover foto do Book"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-3 space-y-1">
                        <span className="text-[9px] uppercase tracking-widest text-gold font-sans font-semibold block">
                          {photo.tag}
                        </span>
                        <p className="text-xs font-medium text-ivory truncate">
                          {photo.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: Vídeo Showreel */}
          {activeTab === 'video' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 bg-[#141414] border border-gold/30 rounded-sm space-y-3">
                <h4 className="text-xs font-medium text-gold uppercase tracking-wider flex items-center gap-2">
                  <Play className="w-4 h-4" /> Vídeo Showreel de Apresentação
                </h4>
                <p className="text-xs text-ivory/60 font-sans leading-relaxed">
                  Insira o link direto de vídeo em alta resolução (MP4, Cloud Storage, Vimeo ou YouTube) que será reproduzido no seu portfólio oficial.
                </p>

                <div>
                  <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                    URL ou Arquivo do Vídeo (MP4 / Streaming)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#181818] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-sm"
                    />
                    <label className="px-3.5 py-2.5 bg-[#202020] hover:bg-gold hover:text-black-matte border border-white/10 text-gold text-xs font-sans font-medium transition-colors rounded-sm cursor-pointer shrink-0 flex items-center gap-1.5" title="Upload de Arquivo de Vídeo">
                      <Upload className="w-4 h-4" />
                      <span className="hidden sm:inline">Upload MP4</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'video')}
                      />
                    </label>
                  </div>
                </div>

                {videoUrl && (
                  <div className="relative aspect-video w-full max-w-lg mx-auto bg-black border border-white/10 rounded-sm overflow-hidden mt-3">
                    <video src={videoUrl} controls className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 4: Ficha Técnica & Medidas */}
          {activeTab === 'measurements' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-4">
                <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-gold font-semibold block">
                  Biometria e Medidas Corporais
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-ivory/60 mb-1">Altura (cm)</label>
                    <input
                      type="text"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3 py-2 text-xs text-ivory outline-none text-center font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-ivory/60 mb-1">Peso (kg)</label>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3 py-2 text-xs text-ivory outline-none text-center font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-ivory/60 mb-1">Cintura (cm)</label>
                    <input
                      type="text"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3 py-2 text-xs text-ivory outline-none text-center font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-ivory/60 mb-1">Busto (cm)</label>
                    <input
                      type="text"
                      value={bust}
                      onChange={(e) => setBust(e.target.value)}
                      className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3 py-2 text-xs text-ivory outline-none text-center font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-ivory/60 mb-1">Quadril (cm)</label>
                    <input
                      type="text"
                      value={hips}
                      onChange={(e) => setHips(e.target.value)}
                      className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3 py-2 text-xs text-ivory outline-none text-center font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-gold font-semibold block">
                  Fisiognomia & Idiomas
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-ivory/60 mb-1">Cor dos Olhos</label>
                    <input
                      type="text"
                      value={eyeColor}
                      onChange={(e) => setEyeColor(e.target.value)}
                      className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3 py-2 text-xs text-ivory outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-ivory/60 mb-1">Cor do Cabelo</label>
                    <input
                      type="text"
                      value={hairColor}
                      onChange={(e) => setHairColor(e.target.value)}
                      className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3 py-2 text-xs text-ivory outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-ivory/60 mb-1">Tom de Pele</label>
                    <input
                      type="text"
                      value={skinTone}
                      onChange={(e) => setSkinTone(e.target.value)}
                      className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3 py-2 text-xs text-ivory outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-ivory/60 mb-1">Idiomas (separados por vírgula)</label>
                    <input
                      type="text"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                      className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3 py-2 text-xs text-ivory outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 5: Diretrizes, Limites e Negócio */}
          {activeTab === 'limits' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                  Faturamento Mensal Estimado
                </label>
                <input
                  type="text"
                  value={monthlyRevenueEstimate}
                  onChange={(e) => setMonthlyRevenueEstimate(e.target.value)}
                  placeholder="Ex: R$ 50.000 / mês"
                  className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                  Limites Pessoais & Preservação de Imagem
                </label>
                <textarea
                  rows={2}
                  value={personalLimits}
                  onChange={(e) => setPersonalLimits(e.target.value)}
                  placeholder="Descreva seus limites e exigências contratuais..."
                  className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold p-3 text-xs text-ivory outline-none rounded-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-widest mb-1.5 font-medium">
                  Objetivo Principal com as Agências
                </label>
                <textarea
                  rows={2}
                  value={mainGoal}
                  onChange={(e) => setMainGoal(e.target.value)}
                  placeholder="Ex: Contratos editoriais internacionais, campanhas de luxo..."
                  className="w-full bg-[#141414] border border-white/[0.12] focus:border-gold p-3 text-xs text-ivory outline-none rounded-sm"
                />
              </div>
            </div>
          )}

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
                  <span>Salvar Atualizações</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
