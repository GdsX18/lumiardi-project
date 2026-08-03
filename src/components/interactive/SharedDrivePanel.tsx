'use client';

import React, { useState } from 'react';
import { Upload, FileText, Image as ImageIcon, Video, ShieldCheck, Download, Search, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/context/LanguageContext';

export interface SharedFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  size: string;
  uploadedBy: string;
  date: string;
  downloads: number;
}

export const SharedDrivePanel: React.FC = () => {
  const { t } = useLanguage();

  const initialFiles: SharedFile[] = [
    {
      id: '1',
      name: t('drive_file1_name'),
      type: 'image',
      size: '14.2 MB',
      uploadedBy: t('drive_creator'),
      date: t('drive_today'),
      downloads: 3,
    },
    {
      id: '2',
      name: t('drive_file2_name'),
      type: 'video',
      size: '245.8 MB',
      uploadedBy: t('drive_creator'),
      date: t('drive_yesterday'),
      downloads: 7,
    },
    {
      id: '3',
      name: t('drive_file3_name'),
      type: 'document',
      size: '2.1 MB',
      uploadedBy: t('drive_agency_aura'),
      date: '01/08/2026',
      downloads: 12,
    },
    {
      id: '4',
      name: t('drive_file4_name'),
      type: 'document',
      size: '4.8 MB',
      uploadedBy: t('drive_agency_aura'),
      date: '28/07/2026',
      downloads: 5,
    },
  ];

  const [extraFiles, setExtraFiles] = useState<SharedFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleSimulatedUpload = () => {
    const newFile: SharedFile = {
      id: Date.now().toString(),
      name: `${t('drive_simulated_file')}${initialFiles.length + extraFiles.length + 1}_HD.jpg`,
      type: 'image',
      size: '8.4 MB',
      uploadedBy: t('drive_creator'),
      date: t('drive_just_now'),
      downloads: 0,
    };
    setExtraFiles([newFile, ...extraFiles]);
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const files = [...extraFiles, ...initialFiles];

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white border border-[#0B0B0B]/10 shadow-2xl p-6 md:p-10 space-y-8">
      {/* Topo do Drive */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#0B0B0B]/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="gold">{t('chat_status')}</Badge>
            <span className="text-xs text-[#8C6B2F] font-sans font-medium uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> {t('drive_title')}
            </span>
          </div>
          <h2 className="font-serif-lumiardi text-2xl md:text-4xl font-light text-[#0B0B0B]">
            {t('drive_title')}
          </h2>
          <p className="text-xs md:text-sm text-[#0B0B0B]/70 font-sans font-light mt-1">
            {t('drive_subtitle')}
          </p>
        </div>

        {/* Botão de Upload */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulatedUpload}
            className="px-6 py-3 bg-[#C9A96B] text-[#0B0B0B] text-xs font-sans tracking-[0.2em] uppercase font-semibold hover:bg-[#D4B87A] transition-all flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{t('drive_upload')}</span>
          </button>
        </div>
      </div>

      {/* Alerta de Sucesso no Upload */}
      {uploadSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 text-xs font-sans flex items-center gap-3 animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{t('drive_upload')} ✓</span>
        </div>
      )}

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FAF7F2] p-4 border border-[#0B0B0B]/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0B0B0B]/40" />
          <input
            type="text"
            placeholder={t('drive_search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-sans bg-white border border-[#0B0B0B]/15 text-[#0B0B0B] focus:outline-none focus:border-[#C9A96B]"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-sans text-[#0B0B0B]/70">
          <span>{t('drive_storage')} <strong>264.9 MB / 10 GB</strong></span>
        </div>
      </div>

      {/* Grid de Arquivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className="bg-[#FAF7F2] border border-[#0B0B0B]/10 p-5 flex flex-col justify-between space-y-4 hover:border-[#C9A96B] transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="p-3 bg-white border border-[#0B0B0B]/10 text-[#8C6B2F] shrink-0">
                {file.type === 'image' && <ImageIcon className="w-6 h-6 stroke-[1.5]" />}
                {file.type === 'video' && <Video className="w-6 h-6 stroke-[1.5]" />}
                {file.type === 'document' && <FileText className="w-6 h-6 stroke-[1.5]" />}
              </div>

              <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 font-sans ${
                file.uploadedBy === t('drive_creator')
                  ? 'bg-[#C9A96B]/20 text-[#8C6B2F] font-semibold'
                  : 'bg-blue-100 text-blue-900 font-semibold'
              }`}>
                {file.uploadedBy}
              </span>
            </div>

            <div>
              <h4 className="font-sans text-xs font-medium text-[#0B0B0B] line-clamp-2 leading-snug group-hover:text-[#8C6B2F] transition-colors" title={file.name}>
                {file.name}
              </h4>
              <div className="flex items-center justify-between text-[10px] text-[#0B0B0B]/60 font-sans mt-2">
                <span>{file.size}</span>
                <span>{file.date}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#0B0B0B]/10 flex items-center justify-between text-xs">
              <span className="text-[10px] text-[#0B0B0B]/50 font-sans">{file.downloads} {t('drive_downloads')}</span>
              <button
                onClick={() => alert(`Download: ${file.name}`)}
                className="p-1.5 hover:bg-white text-[#8C6B2F] border border-transparent hover:border-[#C9A96B] transition-all cursor-pointer"
                title={t('drive_download')}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
