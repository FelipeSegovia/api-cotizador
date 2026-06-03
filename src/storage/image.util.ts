import sharp from 'sharp';

const LOGO_MAX_DIMENSION = 512;
const WEBP_QUALITY = 80;

/**
 * Convierte un buffer de imagen (png, jpeg, gif, webp) a WebP optimizado para logos.
 */
export async function convertToWebp(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize({
      width: LOGO_MAX_DIMENSION,
      height: LOGO_MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}
