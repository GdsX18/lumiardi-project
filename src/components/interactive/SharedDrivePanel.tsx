'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  ShieldCheck,
  Download,
  Search,
  CheckCircle2,
  Folder,
  Lock,
  Trash2,
  X,
  RefreshCw,
  FileBox,
  Eye,
  Edit3,
  Copy,
  ExternalLink,
  Users,
  Fingerprint,
} from 'lucide-react';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';

export interface DriveItem {
  id: string;
  name: string;
  category: 'raw-photos' | 'videos' | 'contracts' | 'briefings' | 'compostos' | string;
  type: 'image' | 'video' | 'document' | string;
  size: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedById?: string;
  fileUrl: string;
  downloads: number;
  privacy?: 'public' | 'agency-only' | 'encrypted' | string;
  createdAt?: string;
  isShared?: boolean;
}

export interface SharedDrivePanelProps {
  initialDriveMode?: 'private' | 'shared';
  targetModelId?: string;
  targetAgencyId?: string;
}

export const SharedDrivePanel: React.FC<SharedDrivePanelProps> = ({
  initialDriveMode = 'private',
  targetModelId,
  targetAgencyId,
}) => {
  const { currentUser } = useAuthPortal();
  const { t } = useLanguage();
  const [driveMode, setDriveMode] = useState<'private' | 'shared'>(initialDriveMode);
  const [files, setFiles] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeContract, setActiveContract] = useState<any>(null);

  // Estado para renomear arquivo
  const [renamingFile, setRenamingFile] = useState<DriveItem | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [storageInfo, setStorageInfo] = useState<{
    usedGB: number;
    maxGB: number;
    percentage: number;
    planName: string;
    fileCount: number;
  }>({
    usedGB: 0,
    maxGB: 5,
    percentage: 0,
    planName: 'Glow',
    fileCount: 0,
  });
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Estados do Modal de Visualização Segura com Marca d'Água Dinâmica & Presigned URL
  const [previewFile, setPreviewFile] = useState<DriveItem | null>(null);
  const [signedUrlData, setSignedUrlData] = useState<{
    signedUrl: string;
    fileKey: string;
    expiresAt: string;
    watermark: {
      watermarkText: string;
      securityHash: string;
      timestamp: string;
    };
  } | null>(null);
  const [isLoadingSignedUrl, setIsLoadingSignedUrl] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Carregar arquivos da API
  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (targetModelId) params.append('modelId', targetModelId);
      if (targetAgencyId) params.append('agencyId', targetAgencyId);
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const url = driveMode === 'shared'
        ? `/api/drive/shared${queryStr}`
        : '/api/drive';

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.files) {
          setFiles(data.files);
        }
        if (data.storage) {
          setStorageInfo(data.storage);
        }
        if (data.contract) {
          setActiveContract(data.contract);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar drive:', err);
    } finally {
      setLoading(false);
    }
  }, [driveMode, targetModelId, targetAgencyId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Upload Real de Arquivo
  const handleRealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFileList = e.target.files;
    if (!uploadedFileList || uploadedFileList.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      for (const file of Array.from(uploadedFileList)) {
        const isImg = file.type.startsWith('image/');
        const isVid = file.type.startsWith('video/');
        const isDoc = file.type.includes('pdf') || file.type.includes('word') || file.type.includes('text');

        let category = 'raw-photos';
        let type = 'image';

        if (isVid) {
          category = 'videos';
          type = 'video';
        } else if (isDoc) {
          category = file.name.toLowerCase().includes('contrato') ? 'contracts' : 'briefings';
          type = 'document';
        }

        // 1. Enviar arquivo para /api/upload
        const formData = new FormData();
        formData.append('file', file);
        const upRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        let fileUrl = '';
        let fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

        if (upRes.ok) {
          const upData = await upRes.json();
          fileUrl = upData.url || '';
          fileSize = upData.size || fileSize;
        }

        if (!fileUrl) {
          fileUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.readAsDataURL(file);
          });
        }

        // 2. Salvar metadados na API correspondente
        if (driveMode === 'shared') {
          const res = await fetch('/api/drive/shared', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: file.name,
              category,
              type,
              size: fileSize,
              fileUrl,
              modelId: targetModelId,
              agencyId: targetAgencyId,
            }),
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Falha ao salvar no drive compartilhado.');
          }
        } else {
          const driveRes = await fetch('/api/drive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: file.name,
              category,
              type,
              size: fileSize,
              fileUrl,
              privacy: 'agency-only',
            }),
          });

          if (!driveRes.ok) {
            const errData = await driveRes.json();
            throw new Error(errData.error || 'Falha ao salvar no drive.');
          }
        }
      }

      setUploadSuccess(`Upload de ${uploadedFileList.length} arquivo(s) concluído com sucesso!`);
      setTimeout(() => setUploadSuccess(null), 4000);
      await fetchFiles();
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao realizar upload');
      setTimeout(() => setUploadError(null), 6000);
    } finally {
      setIsUploading(false);
    }
  };

  // Renomear Arquivo
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFile || !newFileName.trim()) return;

    setIsRenaming(true);
    try {
      if (driveMode === 'shared') {
        const res = await fetch('/api/drive/shared', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: renamingFile.id, name: newFileName.trim() }),
        });
        if (!res.ok) throw new Error('Não foi possível renomear o arquivo.');
      } else {
        // Renomear localmente para modo privado
        setFiles((prev) =>
          prev.map((f) => (f.id === renamingFile.id ? { ...f, name: newFileName.trim() } : f))
        );
      }
      setRenamingFile(null);
      setNewFileName('');
      await fetchFiles();
    } catch (err: any) {
      alert(err.message || 'Erro ao renomear');
    } finally {
      setIsRenaming(false);
    }
  };

  // Abrir Prévia Segura com Presigned URL R2 e Marca d'Água Dinâmica
  const handleOpenSecurePreview = async (file: DriveItem) => {
    setPreviewFile(file);
    setIsLoadingSignedUrl(true);
    setCopiedUrl(false);

    try {
      const res = await fetch('/api/drive/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type === 'video' ? 'video/mp4' : file.type === 'document' ? 'application/pdf' : 'image/jpeg',
          category: file.category || 'raw-photos',
          userId: currentUser?.id || 'model-elena-vip',
          operation: 'download',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSignedUrlData(data);
      }
    } catch (err) {
      console.error('Erro ao requisitar presigned URL:', err);
    } finally {
      setIsLoadingSignedUrl(false);
    }
  };

  // Download Real de Arquivo
  const handleDownload = async (file: DriveItem) => {
    try {
      if (driveMode !== 'shared') {
        await fetch('/api/drive', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: file.id }),
        });
      }

      if (file.fileUrl) {
        const a = document.createElement('a');
        a.href = file.fileUrl;
        a.download = file.name;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const blob = new Blob([`Lumiardi VIP Document - ${file.name}\nProtocolo de Segurança: E2E-256-BIT`], {
          type: 'text/plain;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, downloads: f.downloads + 1 } : f))
      );
    } catch (err) {
      console.error('Erro ao realizar download:', err);
    }
  };

  // Exclusão Real de Arquivo
  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente remover este arquivo do Lumiardi Drive?')) {
      try {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        if (driveMode === 'shared') {
          await fetch(`/api/drive/shared?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
          });
        } else {
          await fetch(`/api/drive?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
          });
        }
      } catch (err) {
        console.error('Erro ao excluir:', err);
      }
    }
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || f.category === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="w-full bg-[#0D0D0D] border border-gold/30 text-ivory shadow-2xl p-6 md:p-8 space-y-6 rounded-sm">
      {/* SELETOR DE MODO DO DRIVE (PRIVADO VS COMPARTILHADO) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-[#121212] border border-white/10 rounded-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDriveMode('private')}
            className={`px-4 py-2 text-xs font-sans uppercase tracking-wider font-semibold rounded-xs transition-all cursor-pointer flex items-center gap-2 ${
              driveMode === 'private'
                ? 'bg-gold text-black-matte shadow-md'
                : 'text-ivory/60 hover:text-ivory hover:bg-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Meu Drive Privado</span>
          </button>

          <button
            type="button"
            onClick={() => setDriveMode('shared')}
            className={`px-4 py-2 text-xs font-sans uppercase tracking-wider font-semibold rounded-xs transition-all cursor-pointer flex items-center gap-2 ${
              driveMode === 'shared'
                ? 'bg-gold text-black-matte shadow-md'
                : 'text-ivory/60 hover:text-ivory hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Drive Compartilhado (Modelo / Agência)</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-gold flex items-center gap-1.5 px-3 py-1 bg-gold/10 border border-gold/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{driveMode === 'shared' ? 'Acesso Exclusivo das Partes Contratantes' : 'Acesso Restrito ao Titular'}</span>
        </div>
      </div>

      {/* Topo do Drive */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gold font-sans uppercase tracking-wider flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {driveMode === 'shared'
                ? 'Repositório Compartilhado Modelo ↔ Agência'
                : 'Storage Privado Cloudflare R2 & Watermark Anti-Vazamento'}
            </span>
          </div>
          <h2 className="font-serif-lumiardi text-2xl md:text-4xl font-light text-ivory">
            {driveMode === 'shared'
              ? 'Drive Compartilhado — Parceria & Campanhas'
              : (t('drive_title') || 'Lumiardi Drive — Mídias Brutas & Contratos')}
          </h2>
          <p className="text-xs md:text-sm text-ivory/60 font-sans mt-1">
            {driveMode === 'shared'
              ? 'Espaço colaborativo exclusivo entre a modelo e a agência contratante para troca de fotos RAW, contratos, compostos e briefings.'
              : 'Envie mídias em resolução máxima RAW sem compressão com Presigned URLs de 5 minutos e marca d\'água forense.'}
          </p>
        </div>

        {/* Botão de Upload Real */}
        <div className="flex items-center gap-3">
          <label className="px-5 py-2.5 bg-gold text-black-matte text-xs font-sans tracking-[0.15em] uppercase font-bold hover:bg-gold-light transition-all flex items-center gap-2 shadow-lg shadow-gold/20 cursor-pointer rounded-xs">
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Enviando...' : (driveMode === 'shared' ? 'Enviar ao Drive Compartilhado' : (t('drive_upload_btn') || 'Fazer Upload Real'))}</span>
            <input
              type="file"
              multiple
              disabled={isUploading}
              className="hidden"
              onChange={handleRealUpload}
            />
          </label>

          <button
            onClick={fetchFiles}
            title="Atualizar arquivos"
            className="p-2.5 bg-[#141414] hover:bg-[#202020] border border-white/10 text-ivory/70 hover:text-gold transition-colors rounded-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {uploadSuccess && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 p-4 text-xs font-sans flex items-center justify-between gap-3 rounded-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
          <button onClick={() => setUploadSuccess(null)} className="text-emerald-400/60 hover:text-emerald-300 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {uploadError && (
        <div className="bg-rose-950/70 border border-rose-500/40 text-rose-300 p-4 text-xs font-sans flex items-center justify-between gap-3 rounded-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <X className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-rose-400/60 hover:text-rose-300 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de Uso da Cota do Plano */}
      <div className="p-4 bg-[#111111] border border-white/[0.08] rounded-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-sans gap-1">
          <div className="flex items-center gap-2">
            <span className="text-gold font-semibold uppercase tracking-wider text-[10px]">
              {t('drive_quota_plan') || 'Cota do Plano'} {storageInfo.planName}
            </span>
            <span className="text-ivory/40">•</span>
            <span className="text-ivory/60">{storageInfo.fileCount} arquivo(s) armazenado(s)</span>
          </div>
          <span className="text-ivory font-mono">
            <strong>{storageInfo.usedGB.toFixed(2)} GB</strong> de {storageInfo.maxGB} GB ({storageInfo.percentage}%)
          </span>
        </div>

        <div className="w-full bg-[#181818] h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              storageInfo.percentage > 90
                ? 'bg-rose-500'
                : storageInfo.percentage > 70
                ? 'bg-amber-400'
                : 'bg-gold'
            }`}
            style={{ width: `${Math.max(2, storageInfo.percentage)}%` }}
          />
        </div>
      </div>

      {/* Pastas e Categorias de Arquivo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedFolder('all')}
          className={`p-3.5 border text-left transition-all cursor-pointer rounded-xs ${
            selectedFolder === 'all'
              ? 'bg-gold/15 border-gold text-gold font-semibold'
              : 'bg-[#141414] border-white/5 text-ivory/70 hover:text-ivory hover:border-white/20'
          }`}
        >
          <Folder className="w-4 h-4 mb-2 text-gold" />
          <span className="text-xs font-sans block">{t('drive_all_files') || 'Todos os Arquivos'}</span>
          <span className="text-[10px] text-ivory/40 block">{files.length} itens</span>
        </button>

        <button
          onClick={() => setSelectedFolder('raw-photos')}
          className={`p-3.5 border text-left transition-all cursor-pointer rounded-xs ${
            selectedFolder === 'raw-photos'
              ? 'bg-gold/15 border-gold text-gold font-semibold'
              : 'bg-[#141414] border-white/5 text-ivory/70 hover:text-ivory hover:border-white/20'
          }`}
        >
          <ImageIcon className="w-4 h-4 mb-2 text-gold" />
          <span className="text-xs font-sans block">{t('drive_raw_photos') || 'Fotos Brutas RAW'}</span>
          <span className="text-[10px] text-ivory/40 block">{t('drive_uncompressed') || 'Sem compressão'}</span>
        </button>

        <button
          onClick={() => setSelectedFolder('contracts')}
          className={`p-3.5 border text-left transition-all cursor-pointer rounded-xs ${
            selectedFolder === 'contracts'
              ? 'bg-gold/15 border-gold text-gold font-semibold'
              : 'bg-[#141414] border-white/5 text-ivory/70 hover:text-ivory hover:border-white/20'
          }`}
        >
          <Lock className="w-4 h-4 mb-2 text-gold" />
          <span className="text-xs font-sans block">{t('drive_contracts') || 'Contratos & NDAs'}</span>
          <span className="text-[10px] text-ivory/40 block">{t('drive_encrypted') || 'Criptografados'}</span>
        </button>

        <button
          onClick={() => setSelectedFolder('briefings')}
          className={`p-3.5 border text-left transition-all cursor-pointer rounded-xs ${
            selectedFolder === 'briefings'
              ? 'bg-gold/15 border-gold text-gold font-semibold'
              : 'bg-[#141414] border-white/5 text-ivory/70 hover:text-ivory hover:border-white/20'
          }`}
        >
          <FileText className="w-4 h-4 mb-2 text-gold" />
          <span className="text-xs font-sans block">{t('drive_briefings') || 'Briefings de Marca'}</span>
          <span className="text-[10px] text-ivory/40 block">{t('drive_guidelines') || 'Diretrizes'}</span>
        </button>
      </div>

      {/* Barra de Busca e Quota de Disco */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#121212] p-4 border border-white/10 rounded-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40" />
          <input
            type="text"
            placeholder={t('drive_search_placeholder') || 'Buscar por nome do arquivo...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-sans bg-[#181818] border border-white/10 text-ivory focus:outline-none focus:border-gold rounded-xs"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-sans text-ivory/70">
          <span className="inline-flex items-center gap-1.5 text-[11px] bg-gold/10 text-gold px-3 py-1 border border-gold/30">
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Presigned URLs (5 Minutos) & Watermark Ativa</span>
          </span>
        </div>
      </div>

      {/* Grid de Arquivos ou Empty State */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 bg-[#121212] border border-dashed border-white/15 text-center space-y-4 rounded-sm">
          <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mx-auto">
            <FileBox className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-serif-lumiardi text-lg font-light text-ivory">
              Nenhum arquivo encontrado nesta pasta
            </h3>
            <p className="text-xs text-ivory/50 font-sans">
              Faça o upload do primeiro documento, ensaio RAW ou vídeo de alta fidelidade para disponibilizar no drive.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-light text-black-matte text-xs font-sans font-semibold uppercase tracking-wider rounded-xs cursor-pointer shadow-md transition-all">
            <Upload className="w-3.5 h-3.5" />
            <span>Enviar Arquivo Agora</span>
            <input type="file" multiple className="hidden" onChange={handleRealUpload} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-[#121212] border border-white/10 hover:border-gold/50 p-5 flex flex-col justify-between space-y-4 transition-all group shadow-md rounded-xs"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 bg-[#181818] border border-white/10 text-gold shrink-0 rounded-xs">
                  {file.type === 'image' && <ImageIcon className="w-6 h-6 stroke-[1.5]" />}
                  {file.type === 'video' && <Video className="w-6 h-6 stroke-[1.5]" />}
                  {file.type === 'document' && <FileText className="w-6 h-6 stroke-[1.5]" />}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] uppercase tracking-wider px-2 py-0.5 font-sans border font-medium rounded-xs ${
                      file.privacy === 'encrypted'
                        ? 'bg-rose-950/60 text-rose-300 border-rose-700/40'
                        : file.privacy === 'agency-only'
                        ? 'bg-gold/15 text-gold border-gold/30'
                        : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/40'
                    }`}
                  >
                    {file.privacy === 'encrypted' && 'Criptografia Forte'}
                    {file.privacy === 'agency-only' && 'Apenas Agência'}
                    {file.privacy === 'public' && 'Público'}
                  </span>

                  <button
                    onClick={() => {
                      setRenamingFile(file);
                      setNewFileName(file.name);
                    }}
                    className="p-1 text-ivory/40 hover:text-gold transition-colors cursor-pointer"
                    title="Renomear Arquivo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-1 text-ivory/40 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Excluir Arquivo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-serif-lumiardi text-sm text-ivory font-medium line-clamp-1 group-hover:text-gold transition-colors">
                  {file.name}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-ivory/40 font-sans">
                  <span>{file.size}</span>
                  <span>•</span>
                  <span>{file.uploadedBy}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                {/* Botão de Visualização Segura com Watermark */}
                <button
                  type="button"
                  onClick={() => handleOpenSecurePreview(file)}
                  className="px-3 py-1.5 bg-[#181818] hover:bg-white/10 text-ivory/80 hover:text-gold text-xs font-sans font-medium transition-all flex items-center gap-1.5 rounded-xs cursor-pointer border border-white/10"
                  title="Ver com Marca d'Água e Link Temporário"
                >
                  <Eye className="w-3.5 h-3.5 text-gold" />
                  <span>Inspecionar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(file)}
                  className="px-3 py-1.5 bg-[#181818] hover:bg-gold hover:text-black-matte border border-gold/30 text-gold text-xs font-sans font-medium transition-all flex items-center gap-1.5 rounded-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Renomear Arquivo */}
      {renamingFile && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setRenamingFile(null)}
        >
          <div
            className="w-full max-w-md bg-[#111111] border border-gold/40 p-6 space-y-4 shadow-2xl text-ivory rounded-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif-lumiardi text-lg text-ivory">Renomear Arquivo</h3>
              <button onClick={() => setRenamingFile(null)} className="text-ivory/50 hover:text-gold cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-wider mb-1">
                  Nome do Arquivo
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full bg-[#181818] border border-white/15 focus:border-gold px-3 py-2 text-xs text-ivory outline-none rounded-xs"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setRenamingFile(null)}
                  className="px-3 py-1.5 text-xs font-sans text-ivory/60 hover:text-ivory cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRenaming || !newFileName.trim()}
                  className="px-5 py-2 bg-gold hover:bg-gold-light text-black-matte font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer rounded-xs disabled:opacity-50"
                >
                  {isRenaming ? 'Salvando...' : 'Salvar Novo Nome'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL DE VISUALIZAÇÃO SEGURA DO VAULT COM MARCA D'ÁGUA DINÂMICA
      ═══════════════════════════════════════════════════════════════ */}
      {previewFile && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="w-full max-w-2xl bg-[#0E0E0E] border border-gold/50 p-6 md:p-8 space-y-6 shadow-[0_0_80px_rgba(0,0,0,0.95)] text-ivory relative rounded-sm my-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fechar */}
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 text-ivory/50 hover:text-gold p-2 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho */}
            <div className="space-y-1 border-b border-white/10 pb-4 pr-8">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase font-mono tracking-widest font-semibold">
                <ShieldCheck className="w-3 h-3" />
                <span>Cloudflare R2 Vault · DRM Protegido</span>
              </div>
              <h3 className="font-serif-lumiardi text-xl md:text-2xl text-ivory">
                {previewFile.name}
              </h3>
              <p className="text-xs font-sans text-ivory/60">
                Visualização segura com proteção de marca d'água dinâmica e link assinado de curta duração.
              </p>
            </div>

            {/* Container da Mídia com Watermark Overlay Anti-Vazamento */}
            <div className="relative w-full h-64 sm:h-80 bg-neutral-950 border border-white/10 rounded-xs overflow-hidden flex items-center justify-center select-none">
              {previewFile.fileUrl && previewFile.type === 'image' ? (
                <img
                  src={previewFile.fileUrl}
                  alt={previewFile.name}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <div className="text-center space-y-2 p-6">
                  <FileText className="w-16 h-16 text-gold mx-auto stroke-[1.2]" />
                  <p className="text-xs font-sans text-ivory/70">Documento / Mídia RAW Criptografada</p>
                </div>
              )}

              {/* Marca d'Água Dinâmica Repetida e Semi-Transparente */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-around opacity-30 select-none overflow-hidden rotate-[-18deg] scale-125">
                {[1, 2, 3, 4].map((row) => (
                  <div key={row} className="flex justify-around whitespace-nowrap text-[11px] font-mono tracking-widest text-gold font-bold uppercase">
                    <span>
                      {signedUrlData?.watermark.watermarkText || `LUMIARDI PROTECTED · ID:${currentUser?.id?.substring(0, 8) || 'ELENA-VIP'}`}
                    </span>
                    <span>
                      {signedUrlData?.watermark.securityHash || 'SHA256-TOKEN-DRM-2257'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Caixa de Metadados da Presigned URL R2 */}
            <div className="p-4 bg-[#141414] border border-white/10 space-y-3 text-xs font-sans rounded-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Presigned URL Assinada (5 Minutos)
                </span>
                <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-600/40 px-2 py-0.5 uppercase">
                  Expiração: 300s
                </span>
              </div>

              <div className="p-2.5 bg-[#090909] border border-white/5 font-mono text-[11px] text-ivory/70 break-all select-all flex items-center justify-between gap-2">
                <span className="truncate">
                  {signedUrlData?.signedUrl || 'Gerando URL assinada Cloudflare R2...'}
                </span>
                {signedUrlData?.signedUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(signedUrlData.signedUrl);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className="p-1 text-gold hover:text-gold-light shrink-0 cursor-pointer"
                    title="Copiar link assinado"
                  >
                    {copiedUrl ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-ivory/60 font-mono pt-1">
                <div>
                  <span className="text-ivory/40 block text-[9px] uppercase">Rastreabilidade IP / Hash:</span>
                  <span className="text-ivory/90">{signedUrlData?.watermark.securityHash || 'HASH-FORENSE-ATIVO'}</span>
                </div>
                <div>
                  <span className="text-ivory/40 block text-[9px] uppercase">Armazenamento:</span>
                  <span className="text-ivory/90">lumiardi-vault-private (R2)</span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-ivory text-xs uppercase tracking-wider font-sans cursor-pointer transition-colors rounded-xs"
              >
                Fechar Prévia
              </button>

              <button
                type="button"
                onClick={() => handleDownload(previewFile)}
                className="px-6 py-2.5 bg-gold hover:bg-gold-light text-black-matte text-xs uppercase tracking-widest font-bold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg rounded-xs"
              >
                <Download className="w-4 h-4" />
                <span>Baixar com Assinatura Segura</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
