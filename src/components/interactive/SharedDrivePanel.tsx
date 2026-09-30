'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  ShieldCheck,
  Download,
  Search,
  CheckCircle2,
  Lock,
  Trash2,
  X,
  RefreshCw,
  FolderLock,
  Eye,
  Edit3,
  Copy,
  Users,
  AlertCircle,
  Building2,
  UserCheck,
  ChevronDown,
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
  privacy?: 'public' | 'agency-only' | 'encrypted' | 'official' | string;
  createdAt?: string;
  isShared?: boolean;
  isOfficial?: boolean;
}

export interface PartnerOption {
  id: string;
  name: string;
  commissionRate?: string;
  status?: string;
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
  const { t, tApiError } = useLanguage();

  const [driveMode, setDriveMode] = useState<'private' | 'shared'>(initialDriveMode);
  const [files, setFiles] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Parceiros do Workspace Switcher (Drive Compartilhado)
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(
    currentUser?.role === 'agencia' ? (targetModelId || '') : (targetAgencyId || '')
  );
  const [activeContract, setActiveContract] = useState<any>(null);

  // Upload e Progresso em Tempo Real
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentUploadingName, setCurrentUploadingName] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado de Renomear e Excluir
  const [renamingFile, setRenamingFile] = useState<DriveItem | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<DriveItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Informações de Cota
  const [storageInfo, setStorageInfo] = useState<{
    usedGB: number;
    maxGB: number;
    percentage: number;
    planName: string;
    agencyName?: string;
    fileCount: number;
  }>({
    usedGB: 0,
    maxGB: 5,
    percentage: 0,
    planName: 'Glow',
    fileCount: 0,
  });

  // Modal de Inspeção com Marca d'Água Forense
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

  // ══════════════════════════════════════════════════════════════════
  // CARREGAR ARQUIVOS DA API
  // ══════════════════════════════════════════════════════════════════
  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (driveMode === 'shared') {
        if (currentUser?.role === 'agencia') {
          const modelParam = selectedPartnerId || targetModelId;
          if (modelParam) params.append('modelId', modelParam);
        } else {
          const agencyParam = selectedPartnerId || targetAgencyId;
          if (agencyParam) params.append('agencyId', agencyParam);
        }
      }

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
        if (data.contract !== undefined) {
          setActiveContract(data.contract);
        }
        if (data.partners && Array.isArray(data.partners)) {
          setPartners(data.partners);
          if (!selectedPartnerId && data.partners.length > 0) {
            setSelectedPartnerId(data.partners[0].id);
          }
        }
      }
    } catch (err) {
      console.error('[SharedDrivePanel] Erro ao carregar arquivos:', err);
    } finally {
      setLoading(false);
    }
  }, [driveMode, selectedPartnerId, targetModelId, targetAgencyId, currentUser]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // ══════════════════════════════════════════════════════════════════
  // UPLOAD DIRETO CLIENT-TO-R2 VIA PRESIGNED URLS
  // ══════════════════════════════════════════════════════════════════
  const handleUploadFiles = async (fileList: FileList | File[]) => {
    const filesToUpload = Array.from(fileList);
    if (filesToUpload.length === 0) return;

    // Se estiver no modo compartilhado e não houver parceiro selecionado
    if (driveMode === 'shared' && !selectedPartnerId) {
      setUploadError(t('dwg_drive_err_select_partner'));
      setTimeout(() => setUploadError(null), 5000);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    const partnerAgencyId = currentUser?.role === 'agencia' ? currentUser?.id : selectedPartnerId;
    const partnerModelId = currentUser?.role === 'agencia' ? selectedPartnerId : currentUser?.id;

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setCurrentUploadingName(file.name);
        setUploadProgress(5);

        const isVid = file.type.startsWith('video/');
        const isDoc = file.type.includes('pdf') || file.type.includes('word') || file.type.includes('text');

        let category = 'raw-photos';
        let type = 'image';

        if (isVid) {
          category = 'videos';
          type = 'video';
        } else if (isDoc) {
          category = file.name.toLowerCase().includes('contrato') || file.name.toLowerCase().includes('nda') 
            ? 'contracts' 
            : 'briefings';
          type = 'document';
        }

        // 1. Requisitar Presigned URL leve ao Next.js
        const urlRes = await fetch('/api/drive/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            category,
            context: driveMode,
            agencyId: partnerAgencyId,
            modelId: partnerModelId,
          }),
        });

        if (!urlRes.ok) {
          const errData = await urlRes.json().catch(() => ({}));
          throw new Error(tApiError(errData, 'dwg_drive_err_upload_auth'));
        }

        const { uploadUrl, fileKey, fileUrl } = await urlRes.json();
        setUploadProgress(15);

        // 2. Upload Binário Direto para Cloudflare R2 com Progresso Real
        let directUploadSucceeded = false;
        try {
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl, true);
            if (file.type) {
              xhr.setRequestHeader('Content-Type', file.type);
            }

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const pct = Math.min(90, Math.round(15 + (event.loaded / event.total) * 75));
                setUploadProgress(pct);
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                directUploadSucceeded = true;
                resolve();
              } else {
                reject(new Error(`R2 HTTP ${xhr.status}`));
              }
            };

            xhr.onerror = () => reject(new Error('Erro de conexão direta com Cloudflare R2.'));
            xhr.send(file);
          });
        } catch (r2Err) {
          console.warn('Falha no upload direto via presigned PUT (tentando fallback seguro):', r2Err);
        }

        // Fallback caso o upload direto falhe por CORS ou bloqueio local.
        // Só para o drive privado: o espaço compartilhado exige a chave emitida para o par agência/modelo.
        let finalFileUrl = fileUrl;
        let finalFileKey = fileKey;
        if (!directUploadSucceeded) {
          if (driveMode === 'shared') {
            throw new Error(t('dwg_drive_err_register_file'));
          }
          const formData = new FormData();
          formData.append('file', file);
          formData.append('category', category);
          const fbRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (!fbRes.ok) {
            const fbErr = await fbRes.json().catch(() => ({}));
            throw new Error(tApiError(fbErr, 'dwg_drive_err_register_file'));
          }
          const fbData = await fbRes.json();
          finalFileUrl = fbData.url || finalFileUrl;
          finalFileKey = fbData.r2Key || finalFileKey;
        }

        setUploadProgress(95);

        // 3. Confirmar e persistir metadados no PostgreSQL
        const confirmRes = await fetch('/api/drive/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileKey: finalFileKey,
            fileUrl: finalFileUrl,
            fileName: file.name,
            fileSize: file.size,
            category,
            fileType: type,
            context: driveMode,
            agencyId: partnerAgencyId,
            modelId: partnerModelId,
            privacy: driveMode === 'shared' ? 'agency-only' : 'agency-only',
          }),
        });

        if (!confirmRes.ok) {
          const confErr = await confirmRes.json().catch(() => ({}));
          throw new Error(tApiError(confErr, 'dwg_drive_err_register_file'));
        }

        setUploadProgress(100);
      }

      setUploadSuccess(
        filesToUpload.length === 1
          ? t('dwg_drive_upload_success_one').replace('{name}', filesToUpload[0].name)
          : t('dwg_drive_upload_success_many').replace('{count}', String(filesToUpload.length))
      );
      setTimeout(() => setUploadSuccess(null), 4000);
      await fetchFiles();
    } catch (err: any) {
      console.error('[SharedDrivePanel] Erro durante upload:', err);
      setUploadError(err.message || t('dwg_drive_err_upload_unexpected'));
      setTimeout(() => setUploadError(null), 6000);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploadingName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // AÇÕES: RENOMEAR, DOWNLOAD E EXCLUIR
  // ══════════════════════════════════════════════════════════════════
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
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(tApiError(d, 'dwg_drive_err_rename_shared'));
        }
      } else {
        setFiles((prev) =>
          prev.map((f) => (f.id === renamingFile.id ? { ...f, name: newFileName.trim() } : f))
        );
      }
      setRenamingFile(null);
      setNewFileName('');
      await fetchFiles();
    } catch (err: any) {
      alert(err.message || t('dwg_drive_err_rename'));
    } finally {
      setIsRenaming(false);
    }
  };

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
        const blob = new Blob([`Lumiardi Vault File - ${file.name}`], { type: 'text/plain;charset=utf-8' });
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
      console.error('[Download Error]:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      const url = driveMode === 'shared'
        ? `/api/drive/shared?id=${encodeURIComponent(fileToDelete.id)}`
        : `/api/drive?id=${encodeURIComponent(fileToDelete.id)}`;

      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(tApiError(d, 'dwg_drive_err_delete_failed'));
      }

      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setFileToDelete(null);
      await fetchFiles();
    } catch (err: any) {
      alert(err.message || t('dwg_drive_err_delete'));
    } finally {
      setIsDeleting(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // INSPEÇÃO / PRÉVIA SEGURA COM WATERMARK FORENSE
  // ══════════════════════════════════════════════════════════════════
  const handleOpenSecurePreview = async (file: DriveItem) => {
    setPreviewFile(file);
    setIsLoadingSignedUrl(true);
    setCopiedUrl(false);

    try {
      // A URL assinada é emitida para a chave real do objeto no R2 (derivada de /api/media/<chave>)
      const mediaPrefix = '/api/media/';
      const fileKey = file.fileUrl?.startsWith(mediaPrefix)
        ? file.fileUrl.slice(mediaPrefix.length).split('/').map(decodeURIComponent).join('/')
        : null;
      if (!fileKey) {
        setSignedUrlData(null);
        return;
      }

      const res = await fetch('/api/drive/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type === 'video' ? 'video/mp4' : file.type === 'document' ? 'application/pdf' : 'image/jpeg',
          category: file.category || 'raw-photos',
          fileKey,
          operation: 'download',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSignedUrlData(data);
      }
    } catch (err) {
      console.error('[Preview Signed Url Error]:', err);
    } finally {
      setIsLoadingSignedUrl(false);
    }
  };

  // Filtragem
  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || f.category === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="w-full bg-[#0A0A0A] border border-[#222222] text-[#F5F2EB] shadow-2xl p-6 md:p-8 space-y-6 rounded-xs">
      {/* 1. SELETOR DE MODO (DRIVE PRIVADO VS DRIVE COMPARTILHADO) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 bg-[#111111] border border-[#1F1F1F] rounded-xs">
        <div className="flex items-center gap-1.5 p-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xs">
          <button
            type="button"
            onClick={() => setDriveMode('private')}
            className={`px-4 py-2 text-xs font-sans font-semibold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer rounded-xs ${
              driveMode === 'private'
                ? 'bg-gold text-[#0A0A0A] shadow-md'
                : 'text-[#F5F2EB]/60 hover:text-[#F5F2EB] hover:bg-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{t('dwg_drive_my_drive')}</span>
          </button>

          <button
            type="button"
            onClick={() => setDriveMode('shared')}
            className={`px-4 py-2 text-xs font-sans font-semibold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer rounded-xs ${
              driveMode === 'shared'
                ? 'bg-gold text-[#0A0A0A] shadow-md'
                : 'text-[#F5F2EB]/60 hover:text-[#F5F2EB] hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t('dwg_drive_shared_drive')}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/20 text-gold text-[11px] font-mono tracking-wide rounded-xs">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>
            {driveMode === 'shared'
              ? t('dwg_drive_env_shared')
              : t('dwg_drive_env_private')}
          </span>
        </div>
      </div>

      {/* 2. WORKSPACE SWITCHER (SELETOR DE PARCEIRO DINÂMICO NO MODO COMPARTILHADO) */}
      {driveMode === 'shared' && (
        <div className="p-4 bg-[#111111] border border-gold/30 rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gold/10 border border-gold/30 text-gold rounded-xs">
              {currentUser?.role === 'agencia' ? <UserCheck className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-gold block font-semibold">
                {currentUser?.role === 'agencia' ? t('dwg_drive_selected_model') : t('dwg_drive_selected_agency')}
              </span>
              <p className="text-xs text-[#F5F2EB]/60 font-sans">
                {currentUser?.role === 'agencia'
                  ? t('dwg_drive_switch_model_desc')
                  : t('dwg_drive_switch_agency_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {partners.length === 0 ? (
              <div className="px-3 py-1.5 text-xs text-[#F5F2EB]/40 bg-[#161616] border border-[#262626] rounded-xs font-sans">
                {t('dwg_drive_no_partners')}
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="appearance-none bg-[#161616] border border-gold/40 text-[#F5F2EB] px-4 py-2 pr-9 text-xs font-sans font-medium rounded-xs focus:outline-none focus:border-gold cursor-pointer"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#161616] text-[#F5F2EB]">
                      {p.name} {p.commissionRate ? `(${p.commissionRate})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gold absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {activeContract && (
              <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono uppercase bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 rounded-xs">
                {t('dwg_drive_active_contract').replace('{rate}', activeContract.commissionRate || '20%')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. CABEÇALHO DO DRIVE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <h2 className="font-serif-lumiardi text-2xl md:text-3xl font-light text-[#F5F2EB]">
            {driveMode === 'shared' ? t('dwg_drive_shared_drive') : t('dwg_drive_my_drive')}
          </h2>
          <p className="text-xs md:text-sm text-[#F5F2EB]/60 font-sans mt-0.5">
            {driveMode === 'shared'
              ? t('dwg_drive_shared_desc')
              : t('dwg_drive_private_desc')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="px-4 py-2 bg-gold hover:bg-gold-light text-[#0A0A0A] text-xs font-sans font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer rounded-xs shadow-md">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? t('dwg_drive_uploading') : t('dwg_drive_upload_file')}</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              disabled={isUploading}
              className="hidden"
              onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
            />
          </label>

          <button
            onClick={fetchFiles}
            title={t('dwg_drive_refresh_list')}
            className="p-2 bg-[#141414] hover:bg-[#1E1E1E] border border-[#222222] text-[#F5F2EB]/70 hover:text-gold transition-colors rounded-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* FEEDBACK DE UPLOAD EM TEMPO REAL */}
      {isUploading && (
        <div className="p-4 bg-[#141414] border border-gold/40 rounded-xs space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-sans">
            <div className="flex items-center gap-2 truncate pr-2">
              <Upload className="w-3.5 h-3.5 text-gold animate-bounce shrink-0" />
              <span className="text-[#F5F2EB] truncate font-medium">
                {t('dwg_drive_uploading_name').replace('{name}', currentUploadingName)}
              </span>
            </div>
            <span className="font-mono text-gold font-semibold shrink-0">
              {uploadProgress}%
            </span>
          </div>

          <div className="w-full bg-[#202020] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(4, uploadProgress)}%` }}
            />
          </div>
          <p className="text-[10px] text-[#F5F2EB]/50 font-sans">
            {t('dwg_drive_direct_upload_note')}
          </p>
        </div>
      )}

      {uploadSuccess && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 p-3 text-xs font-sans flex items-center justify-between gap-3 rounded-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
          <button onClick={() => setUploadSuccess(null)} className="text-emerald-400/60 hover:text-emerald-300 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {uploadError && (
        <div className="bg-rose-950/70 border border-rose-500/40 text-rose-300 p-3 text-xs font-sans flex items-center justify-between gap-3 rounded-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-rose-400/60 hover:text-rose-300 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. BARRA DE CONSUMO DE COTA */}
      <div className="p-4 bg-[#111111] border border-[#1E1E1E] rounded-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-sans gap-1">
          <div className="flex items-center gap-2">
            <span className="text-gold font-semibold uppercase tracking-wider text-[10px] font-mono">
              {driveMode === 'shared'
                ? t('dwg_drive_quota_agency').replace('{agency}', storageInfo.agencyName || t('dwg_drive_linked_agency')).replace('{plan}', storageInfo.planName)
                : t('dwg_drive_quota_personal').replace('{plan}', storageInfo.planName)}
            </span>
            <span className="text-[#F5F2EB]/30">•</span>
            <span className="text-[#F5F2EB]/60">{t('dwg_drive_file_count').replace('{count}', String(storageInfo.fileCount))}</span>
          </div>

          <span className="text-[#F5F2EB] font-mono text-[11px]">
            <strong>{storageInfo.usedGB.toFixed(2)} GB</strong> {t('dwg_drive_of')} {storageInfo.maxGB} GB ({storageInfo.percentage}%)
          </span>
        </div>

        <div className="w-full bg-[#181818] h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              storageInfo.percentage > 90
                ? 'bg-rose-500'
                : storageInfo.percentage > 70
                ? 'bg-amber-400'
                : 'bg-gold'
            }`}
            style={{ width: `${Math.max(2, storageInfo.percentage)}%` }}
          />
        </div>

        {driveMode === 'shared' && (
          <p className="text-[10px] text-[#F5F2EB]/50 font-sans">
            {t('dwg_drive_shared_quota_note')}
          </p>
        )}
      </div>

      {/* 5. ÁREA DE DRAG & DROP INTUITIVA */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-6 border border-dashed rounded-xs text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
          isDragOver
            ? 'border-gold bg-gold/10'
            : 'border-[#262626] bg-[#0E0E0E] hover:border-gold/40'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className={`w-6 h-6 transition-transform ${isDragOver ? 'scale-110 text-gold' : 'text-[#F5F2EB]/40'}`} />
        <div className="space-y-0.5">
          <p className="text-xs font-sans text-[#F5F2EB]/90 font-medium">
            {t('dwg_drive_drop_title')}
          </p>
          <p className="text-[11px] text-[#F5F2EB]/50 font-sans">
            {t('dwg_drive_drop_desc')}
          </p>
        </div>
      </div>

      {/* 6. CATEGORIAS E BARRA DE BUSCA */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        {/* Abas de Categorias */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#111111] border border-[#1F1F1F] rounded-xs text-xs font-sans">
          {[
            { id: 'all', label: t('dwg_drive_cat_all') },
            { id: 'raw-photos', label: t('dwg_drive_cat_raw') },
            { id: 'videos', label: t('dwg_drive_cat_videos') },
            { id: 'contracts', label: t('dwg_drive_cat_contracts') },
            { id: 'briefings', label: t('dwg_drive_cat_briefings') },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedFolder(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                selectedFolder === cat.id
                  ? 'bg-gold/15 text-gold border border-gold/40'
                  : 'text-[#F5F2EB]/60 hover:text-[#F5F2EB] hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Busca */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#F5F2EB]/40" />
          <input
            type="text"
            placeholder={t('dwg_drive_search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-sans bg-[#121212] border border-[#222222] text-[#F5F2EB] focus:outline-none focus:border-gold rounded-xs"
          />
        </div>
      </div>

      {/* 7. GRID DE ARQUIVOS OU EMPTY STATE */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 bg-[#0E0E0E] border border-[#1F1F1F] text-center space-y-3 rounded-xs">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mx-auto">
            <FolderLock className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-serif-lumiardi text-lg font-light text-[#F5F2EB]">
              {t('dwg_drive_empty_title')}
            </h3>
            <p className="text-xs text-[#F5F2EB]/50 font-sans">
              {driveMode === 'shared'
                ? t('dwg_drive_empty_shared')
                : t('dwg_drive_empty_private')}
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-light text-[#0A0A0A] text-xs font-sans font-bold uppercase tracking-wider rounded-xs cursor-pointer shadow-md transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t('dwg_drive_do_upload')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-[#111111] border border-[#1F1F1F] hover:border-gold/40 p-4 flex flex-col justify-between space-y-3 transition-all rounded-xs group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="p-2.5 bg-[#161616] border border-[#262626] text-gold rounded-xs shrink-0">
                  {file.type === 'video' ? (
                    <Video className="w-5 h-5 stroke-[1.5]" />
                  ) : file.type === 'document' ? (
                    <FileText className="w-5 h-5 stroke-[1.5]" />
                  ) : (
                    <ImageIcon className="w-5 h-5 stroke-[1.5]" />
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {file.isOfficial ? (
                    <span className="text-[9px] uppercase font-mono tracking-wider px-2 py-0.5 bg-gold/15 text-gold border border-gold/30 rounded-xs font-semibold">
                      {t('dwg_drive_official')}
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setRenamingFile(file);
                          setNewFileName(file.name);
                        }}
                        className="p-1 text-[#F5F2EB]/40 hover:text-gold transition-colors cursor-pointer"
                        title={t('dwg_drive_rename')}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setFileToDelete(file)}
                        className="p-1 text-[#F5F2EB]/40 hover:text-rose-400 transition-colors cursor-pointer"
                        title={t('dwg_drive_delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-serif-lumiardi text-sm text-[#F5F2EB] font-medium line-clamp-1 group-hover:text-gold transition-colors">
                  {file.name}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-[#F5F2EB]/50 font-sans">
                  <span>{file.size}</span>
                  <span>•</span>
                  <span>{file.uploadedByName || file.uploadedBy || t('dwg_drive_system')}</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#1C1C1C] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenSecurePreview(file)}
                  className="px-2.5 py-1.5 bg-[#161616] hover:bg-white/10 text-[#F5F2EB]/80 hover:text-gold text-xs font-sans transition-all flex items-center gap-1.5 rounded-xs cursor-pointer border border-[#222222]"
                >
                  <Eye className="w-3.5 h-3.5 text-gold" />
                  <span>{t('dwg_drive_inspect')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(file)}
                  className="px-3 py-1.5 bg-[#161616] hover:bg-gold hover:text-[#0A0A0A] border border-gold/30 text-gold text-xs font-sans font-medium transition-all flex items-center gap-1.5 rounded-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('dwg_drive_download')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 8. MODAL DE RENOMEAR */}
      {renamingFile && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setRenamingFile(null)}
        >
          <div
            className="w-full max-w-md bg-[#111111] border border-gold/40 p-6 space-y-4 shadow-2xl text-[#F5F2EB] rounded-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="font-serif-lumiardi text-lg text-[#F5F2EB]">{t('dwg_drive_rename_title')}</h3>
              <button onClick={() => setRenamingFile(null)} className="text-[#F5F2EB]/50 hover:text-gold cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-sans text-[#F5F2EB]/70 uppercase tracking-wider mb-1">
                  {t('dwg_drive_file_name_label')}
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full bg-[#161616] border border-[#2A2A2A] focus:border-gold px-3 py-2 text-xs text-[#F5F2EB] outline-none rounded-xs"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setRenamingFile(null)}
                  className="px-3 py-1.5 text-xs font-sans text-[#F5F2EB]/60 hover:text-[#F5F2EB] cursor-pointer"
                >
                  {t('dwg_drive_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isRenaming || !newFileName.trim()}
                  className="px-4 py-2 bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer rounded-xs disabled:opacity-50"
                >
                  {isRenaming ? t('dwg_drive_saving') : t('dwg_drive_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {fileToDelete && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setFileToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-[#111111] border border-rose-500/40 p-6 space-y-4 shadow-2xl text-[#F5F2EB] rounded-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="font-serif-lumiardi text-lg text-rose-400">{t('dwg_drive_delete_title')}</h3>
              <button onClick={() => setFileToDelete(null)} className="text-[#F5F2EB]/50 hover:text-[#F5F2EB] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-sans text-[#F5F2EB]/80 leading-relaxed">
              {t('dwg_drive_delete_confirm_pre')} <strong className="text-[#F5F2EB]">"{fileToDelete.name}"</strong>{t('dwg_drive_delete_confirm_post')}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-3 py-1.5 text-xs font-sans text-[#F5F2EB]/60 hover:text-[#F5F2EB] cursor-pointer"
              >
                {t('dwg_drive_cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer rounded-xs disabled:opacity-50"
              >
                {isDeleting ? t('dwg_drive_deleting') : t('dwg_drive_confirm_delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. MODAL DE INSPEÇÃO COM MARCA D'ÁGUA DINÂMICA */}
      {previewFile && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="w-full max-w-2xl bg-[#0E0E0E] border border-gold/40 p-6 md:p-8 space-y-6 shadow-2xl text-[#F5F2EB] relative rounded-xs my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 text-[#F5F2EB]/50 hover:text-gold p-1 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-[#222222] pb-3 pr-8">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase font-mono tracking-wider font-semibold">
                <ShieldCheck className="w-3 h-3" />
                <span>{t('dwg_drive_vault_badge')}</span>
              </div>
              <h3 className="font-serif-lumiardi text-xl text-[#F5F2EB]">
                {previewFile.name}
              </h3>
            </div>

            {/* Container da Mídia com Watermark Overlay */}
            <div className="relative w-full h-64 sm:h-80 bg-black border border-[#222222] rounded-xs overflow-hidden flex items-center justify-center select-none">
              {previewFile.fileUrl && previewFile.type === 'image' ? (
                <img
                  src={previewFile.fileUrl}
                  alt={previewFile.name}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <div className="text-center space-y-2 p-6">
                  <FileText className="w-16 h-16 text-gold mx-auto stroke-[1.2]" />
                  <p className="text-xs font-sans text-[#F5F2EB]/70">{t('dwg_drive_protected_media')}</p>
                </div>
              )}

              {/* Marca d'Água Dinâmica Repetida */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-around opacity-25 select-none overflow-hidden rotate-[-15deg] scale-125">
                {[1, 2, 3, 4].map((row) => (
                  <div key={row} className="flex justify-around whitespace-nowrap text-[11px] font-mono tracking-widest text-gold font-bold uppercase">
                    <span>
                      {signedUrlData?.watermark.watermarkText || `LUMIARDI PROTECTED · ID:${currentUser?.id?.substring(0, 8) || 'VIP'}`}
                    </span>
                    <span>
                      {signedUrlData?.watermark.securityHash || 'SHA256-DRM-2257'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadados e Link Temporário */}
            <div className="p-3 bg-[#141414] border border-[#222222] space-y-2 text-xs font-sans rounded-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  {t('dwg_drive_presigned_title')}
                </span>
                <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-600/40 px-2 py-0.5 uppercase">
                  {t('dwg_drive_valid_300s')}
                </span>
              </div>

              <div className="p-2 bg-[#090909] border border-[#1A1A1A] font-mono text-[11px] text-[#F5F2EB]/70 break-all select-all flex items-center justify-between gap-2">
                <span className="truncate">
                  {signedUrlData?.signedUrl || t('dwg_drive_generating_link')}
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
                    title={t('dwg_drive_copy_link')}
                  >
                    {copiedUrl ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[#F5F2EB] text-xs uppercase tracking-wider font-sans cursor-pointer transition-colors rounded-xs"
              >
                {t('dwg_drive_close')}
              </button>

              <button
                type="button"
                onClick={() => handleDownload(previewFile)}
                className="px-5 py-2 bg-gold hover:bg-gold-light text-[#0A0A0A] text-xs uppercase tracking-widest font-bold font-sans transition-all flex items-center gap-2 cursor-pointer rounded-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('dwg_drive_download')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
