import crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  category: string;
  userId: string;
  operation: 'upload' | 'download';
  expiresInSeconds?: number;
  /** Tamanho exato do arquivo em bytes (assinado no PUT) */
  contentLength?: number;
  context?: 'private' | 'shared';
  agencyId?: string;
  modelId?: string;
  fileKey?: string;
}

export interface PresignedUrlResponse {
  success: boolean;
  signedUrl: string;
  fileKey: string;
  publicCdnUrl?: string;
  expiresAt: string;
  headers?: Record<string, string>;
}

let cachedR2Client: S3Client | null = null;

function getR2Client(): S3Client | null {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  if (!cachedR2Client) {
    cachedR2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return cachedR2Client;
}

export const R2StorageService = {
  /**
   * Retorna a instância ativa do cliente S3 para Cloudflare R2
   */
  getClient(): S3Client | null {
    return getR2Client();
  },

  /**
   * Nome do bucket configurado
   */
  getBucketName(): string {
    return process.env.CLOUDFLARE_R2_BUCKET_NAME || 'lumiardi-vault-private';
  },

  /**
   * Gera a chave única do arquivo no bucket com isolamento por usuário ou espaço compartilhado
   */
  generateFileKey(
    userOrParams: string | { userId: string; category: string; fileName: string; context?: 'private' | 'shared'; agencyId?: string; modelId?: string },
    cat?: string,
    fName?: string
  ): string {
    if (typeof userOrParams === 'object') {
      const { userId, category, fileName, context, agencyId, modelId } = userOrParams;
      const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const hash = crypto.randomBytes(6).toString('hex');
      if (context === 'shared' && agencyId && modelId) {
        return `vault/shared/${agencyId}/${modelId}/${category}/${Date.now()}_${hash}_${cleanName}`;
      }
      return `vault/${userId}/${category}/${Date.now()}_${hash}_${cleanName}`;
    }
    const cleanName = (fName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const hash = crypto.randomBytes(6).toString('hex');
    return `vault/${userOrParams}/${cat || 'raw-photos'}/${Date.now()}_${hash}_${cleanName}`;
  },

  /**
   * Metadados reais do objeto (tamanho e tipo) — fonte confiável para cotas; null se não existir.
   */
  async headObject(fileKey: string): Promise<{ size: number; contentType?: string } | null> {
    const client = getR2Client();
    if (!client || !fileKey) return null;
    try {
      const res = await client.send(new HeadObjectCommand({ Bucket: this.getBucketName(), Key: fileKey }));
      return { size: Number(res.ContentLength || 0), contentType: res.ContentType };
    } catch {
      return null;
    }
  },

  /**
   * Remove objeto diretamente do Cloudflare R2
   */
  async deleteObject(fileKey: string): Promise<boolean> {
    const client = getR2Client();
    const bucketName = this.getBucketName();
    if (!client || !fileKey) return false;
    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: fileKey,
        })
      );
      return true;
    } catch (err) {
      console.warn('Erro ao deletar objeto do R2:', err);
      return false;
    }
  },

  /**
   * Realiza o upload direto de um buffer para o Cloudflare R2
   */
  async uploadBuffer(params: {
    key: string;
    buffer: Buffer | Uint8Array;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<{ success: boolean; key: string; url: string; error?: string }> {
    const client = getR2Client();
    const bucketName = this.getBucketName();

    if (!client) {
      return { success: false, key: params.key, url: '', error: 'Cloudflare R2 não configurado no ambiente.' };
    }

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: params.key,
          Body: params.buffer,
          ContentType: params.contentType,
          Metadata: params.metadata,
        })
      );

      const url = this.getPublicUrl(params.key) || `/api/media/${params.key}`;

      return {
        success: true,
        key: params.key,
        url,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Falha ao enviar objeto para o Cloudflare R2';
      console.error('Erro R2StorageService.uploadBuffer:', err);
      return { success: false, key: params.key, url: '', error: errorMsg };
    }
  },

  /**
   * Retorna a URL pública formatada com CDN ativa ou undefined se não configurado
   */
  getPublicUrl(fileKey: string): string | undefined {
    // Conteúdo do vault é privado: sempre servido por /api/media (que aplica autorização por chave)
    if (fileKey.replace(/^\/+/, '').startsWith('vault/')) return undefined;
    const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;
    if (!publicDomain || publicDomain.trim() === '') return undefined;
    const cleanDomain = publicDomain.trim().replace(/\/+$/, '');
    const base = cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://')
      ? cleanDomain
      : `https://${cleanDomain}`;
    return `${base}/${fileKey.replace(/^\/+/, '')}`;
  },

  /**
   * Gera uma URL assinada (Presigned URL) para upload direto ou download protegido
   */
  async createPresignedUrl(req: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    const client = getR2Client();
    const bucketName = this.getBucketName();
    const expiresIn = req.expiresInSeconds || 300; // 5 minutos padrão
    const fileKey = req.fileKey || this.generateFileKey(req);
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    if (client) {
      try {
        const command = req.operation === 'upload'
          ? new PutObjectCommand({
              Bucket: bucketName,
              Key: fileKey,
              ContentType: req.fileType,
              // Tamanho assinado: o R2 rejeita um PUT com Content-Length diferente do declarado
              ...(req.contentLength ? { ContentLength: req.contentLength } : {}),
            })
          : new GetObjectCommand({
              Bucket: bucketName,
              Key: fileKey,
            });

        const signedUrl = await getSignedUrl(client, command, { expiresIn });

        return {
          success: true,
          signedUrl,
          fileKey,
          publicCdnUrl: this.getPublicUrl(fileKey),
          expiresAt,
        };
      } catch (err) {
        console.error('Erro gerando presigned URL no R2:', err);
      }
    }

    // Sem R2 configurado não há URL válida: o chamador deve tratar a falha
    return {
      success: false,
      signedUrl: '',
      fileKey,
      expiresAt,
    };
  },

  /**
   * Gera a assinatura de Marca d'Água Dinâmica Tokenizada
   * Inclui carimbo digital invisível de rastreabilidade (User ID + Timestamp)
   */
  generateWatermarkMetadata(userId: string, viewerIp: string): {
    watermarkText: string;
    securityHash: string;
    timestamp: string;
  } {
    const timestamp = new Date().toISOString();
    const watermarkText = `LUMIARDI PROTECTED · ID:${userId.substring(0, 8)} · ${new Date().toLocaleDateString('pt-BR')}`;
    const securityHash = crypto
      .createHash('sha256')
      .update(`${userId}:${viewerIp}:${timestamp}:lumiardi_drm_salt`)
      .digest('hex')
      .substring(0, 16);

    return {
      watermarkText,
      securityHash,
      timestamp,
    };
  },
};
