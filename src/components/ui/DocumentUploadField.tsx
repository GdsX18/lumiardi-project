'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileCheck, Shield, AlertCircle, X } from 'lucide-react';
import { DocumentUploadData } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface DocumentUploadFieldProps {
  label: string;
  description?: string;
  documentTypeDefault?: 'rg_cnh' | 'passaporte';
  acceptTypes?: string;
  maxSizeMB?: number;
  onUploadComplete: (data: DocumentUploadData) => void;
  required?: boolean;
}

export const DocumentUploadField: React.FC<DocumentUploadFieldProps> = ({
  label,
  description,
  documentTypeDefault = 'rg_cnh',
  acceptTypes = '.pdf,.png,.jpg,.jpeg',
  maxSizeMB = 15,
  onUploadComplete,
  required = true,
}) => {
  const { t } = useLanguage();
  const [docType, setDocType] = useState<'rg_cnh' | 'passaporte'>(documentTypeDefault);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fallbackDesc = t('qual_doc_upload_desc');
  const activeDesc = description || fallbackDesc;

  const handleFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(t('doc_error_max_size').replace('{maxSizeMB}', String(maxSizeMB)));
      return;
    }

    setUploadedFile({
      name: file.name,
      size: file.size,
    });

    onUploadComplete({
      documentType: docType,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      verifiedStatus: 'pending',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#0B0B0B]/90">
          {label} {required && <span className="text-[#C9A96B]">*</span>}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDocType('rg_cnh')}
            className={`px-2.5 py-1 text-[10px] font-sans uppercase tracking-wider transition-colors cursor-pointer ${
              docType === 'rg_cnh'
                ? 'bg-[#C9A96B] text-[#0B0B0B] font-semibold'
                : 'bg-[#0B0B0B]/5 text-[#0B0B0B]/60 hover:text-[#0B0B0B]'
            }`}
          >
            {t('doc_tab_id')}
          </button>
          <button
            type="button"
            onClick={() => setDocType('passaporte')}
            className={`px-2.5 py-1 text-[10px] font-sans uppercase tracking-wider transition-colors cursor-pointer ${
              docType === 'passaporte'
                ? 'bg-[#C9A96B] text-[#0B0B0B] font-semibold'
                : 'bg-[#0B0B0B]/5 text-[#0B0B0B]/60 hover:text-[#0B0B0B]'
            }`}
          >
            {t('doc_tab_passport')}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-[#0B0B0B]/60 font-sans leading-relaxed">
        {activeDesc}
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleInputChange}
        className="hidden"
      />

      {!uploadedFile ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#0B0B0B]/20 hover:border-[#C9A96B] p-6 text-center bg-[#FAF7F2] hover:bg-white transition-all duration-300 cursor-pointer space-y-2 group"
        >
          <div className="w-10 h-10 bg-[#C9A96B]/15 text-[#8C6B2F] rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
            <Upload className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="block text-xs font-sans text-[#0B0B0B]/80 font-medium">
            {t('doc_drag_drop_title')} <span className="text-[#8C6B2F] underline underline-offset-2">{t('doc_click_to_select')}</span>
          </span>
          <span className="block text-[10px] text-[#0B0B0B]/45 font-sans">
            {t('doc_accepted_formats').replace('{maxSizeMB}', String(maxSizeMB))}
          </span>
        </div>
      ) : (
        <div className="p-4 bg-white border border-[#C9A96B] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C9A96B]/20 text-[#8C6B2F]">
              <FileCheck className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <span className="text-xs font-medium font-sans text-[#0B0B0B] block truncate max-w-xs sm:max-w-md">
                {uploadedFile.name}
              </span>
              <span className="text-[10px] text-emerald-700 font-sans flex items-center gap-1">
                <Shield className="w-3 h-3" /> {(uploadedFile.size / (1024 * 1024)).toFixed(2)} {t('doc_attached_secure')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="p-1 text-[#0B0B0B]/40 hover:text-rose-600 transition-colors cursor-pointer"
            aria-label={t('doc_remove_aria')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-sans">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
