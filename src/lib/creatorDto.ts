/**
 * LUMIARDI — DTO público de criadora para o catálogo das agências.
 *
 * Nunca expõe PII: sem e-mail, sem nome civil (o nome exibido é o artístico), sem endereço residencial
 * além de cidade/estado/país. Toda rota que devolve criadoras a agências deve passar por aqui.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toPublicCreator(creator: any) {
  const artisticName = creator.qualitative?.artisticName || 'Criadora Lumiardi';
  const city = creator.basicInfo?.address?.city || '';
  const state = creator.basicInfo?.address?.state || '';
  const country = creator.basicInfo?.address?.country || '';

  return {
    id: creator.id,
    basicInfo: {
      fullName: artisticName,
      address: { city, state, country },
    },
    qualitative: {
      ...creator.qualitative,
      artisticName,
    },
    acceptsOffers: creator.acceptsOffers !== false,
    isRepresented: Boolean(creator.isRepresented),
    representedAgencyName: creator.representedAgencyName,
    photos: creator.photos || [],
    videoUrl: creator.videoUrl || '',
    curationStatus: creator.curationStatus,
    createdAt: creator.createdAt,
  };
}
