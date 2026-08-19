'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Play,
} from 'lucide-react';

export interface MediaItem {
  id?: string;
  url: string;
  title?: string;
  type?: 'image' | 'video' | 'document';
  tag?: string;
}

interface MediaLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaItem[];
  initialIndex?: number;
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoomLevel(1);
      setRotation(0);
    }
  }, [isOpen, initialIndex]);

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    setZoomLevel(1);
    setRotation(0);
  }, [items.length]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
    setRotation(0);
  }, [items.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];
  const isVideo =
    currentItem.type === 'video' ||
    currentItem.url.endsWith('.mp4') ||
    currentItem.url.endsWith('.webm');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Barra de Controle Superior */}
      <div className="absolute top-0 left-0 right-0 p-4 md:px-8 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-gold uppercase tracking-[0.2em] bg-gold/10 px-2.5 py-1 border border-gold/30 rounded-sm">
            {currentIndex + 1} de {items.length}
          </span>
          <span className="text-xs text-ivory/80 font-sans font-medium">
            {currentItem.title || currentItem.tag || 'Mídia da Candidatura'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isVideo && (
            <>
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.3, 3))}
                title="Ampliar Zoom"
                className="p-2 bg-white/10 hover:bg-gold hover:text-black-matte text-ivory rounded-sm transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.3, 0.7))}
                title="Reduzir Zoom"
                className="p-2 bg-white/10 hover:bg-gold hover:text-black-matte text-ivory rounded-sm transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                title="Girar 90°"
                className="p-2 bg-white/10 hover:bg-gold hover:text-black-matte text-ivory rounded-sm transition-colors cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </>
          )}

          <a
            href={currentItem.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            title="Download Original"
            className="p-2 bg-white/10 hover:bg-gold hover:text-black-matte text-ivory rounded-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={onClose}
            title="Fechar Visualizador (ESC)"
            className="p-2 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-sm transition-colors ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navegação Anterior */}
      {items.length > 1 && (
        <button
          onClick={handlePrev}
          title="Anterior (Seta Esquerda)"
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-gold hover:text-black-matte text-ivory border border-white/10 rounded-full transition-all z-20 shadow-xl cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Área Central de Visualização */}
      <div className="relative w-full h-full flex items-center justify-center p-6 md:p-16 overflow-hidden">
        {isVideo ? (
          <div className="max-w-4xl max-h-[80vh] w-full aspect-video bg-black border border-gold/40 shadow-2xl relative rounded-md overflow-hidden">
            <video
              src={currentItem.url}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div
            className="relative max-w-full max-h-full transition-transform duration-200 ease-out flex items-center justify-center"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={currentItem.url}
              alt={currentItem.title || 'Mídia'}
              className="max-w-[85vw] max-h-[80vh] object-contain select-none shadow-2xl border border-white/10"
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* Navegação Próxima */}
      {items.length > 1 && (
        <button
          onClick={handleNext}
          title="Próxima (Seta Direita)"
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-gold hover:text-black-matte text-ivory border border-white/10 rounded-full transition-all z-20 shadow-xl cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Miniaturas no Rodapé */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/80 border border-white/10 rounded-lg max-w-[90vw] overflow-x-auto z-20">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setZoomLevel(1);
                setRotation(0);
              }}
              className={`relative w-12 h-12 rounded-sm overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                currentIndex === idx ? 'border-gold scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {item.type === 'video' || item.url.endsWith('.mp4') ? (
                <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-gold">
                  <Play className="w-4 h-4" />
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={`Thumb ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
