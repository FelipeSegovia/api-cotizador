import 'multer';

/** Archivo de logo ya validado por ParseFilePipe (memoryStorage). */
export interface CompanyLogoUploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export function toCompanyLogoUploadFile(
  file: Express.Multer.File,
): CompanyLogoUploadFile {
  if (!file.buffer) {
    throw new Error('El archivo debe cargarse en memoria');
  }
  return {
    buffer: file.buffer,
    mimetype: file.mimetype,
    originalname: file.originalname,
    size: file.size,
  };
}
