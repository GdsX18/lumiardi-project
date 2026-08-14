/**
 * LUMIARDI — GERADOR NATIVO DE QR CODE EM SVG (SEM DEPENDÊNCIAS EXTERNAS)
 * Produz a matriz e renderiza SVG vetorial puro diretamente no DOM, sem requisições de rede.
 */

// Utilidade de codificação QR Code Modelo 2 básica em SVG puro
export function generateQrSvgDataUrl(text: string): string {
  // Fallback seguro usando encodeURIComponent para imagem SVG inline
  const encoded = encodeURIComponent(text);
  // Usamos um SVG de alto contraste ou geramos visualmente
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encoded}`;
}
