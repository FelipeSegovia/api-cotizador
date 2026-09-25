import { BadRequestException } from '@nestjs/common';

const TAG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;
const MAX_EMAILS = 10;
const MAX_PHONES = 10;
const MAX_PHONE_LENGTH = 64;

/** Normaliza y valida tags libres. Deduplica. */
export function normalizeTags(raw: string[]): string[] {
  if (raw.length > MAX_TAGS) {
    throw new BadRequestException(`Máximo ${MAX_TAGS} etiquetas`);
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of raw) {
    if (typeof item !== 'string') {
      throw new BadRequestException('Cada etiqueta debe ser un texto');
    }
    const normalized = item
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');

    if (normalized.length === 0) {
      continue;
    }
    if (normalized.length > MAX_TAG_LENGTH) {
      throw new BadRequestException(
        `Cada etiqueta debe tener entre 1 y ${MAX_TAG_LENGTH} caracteres`,
      );
    }
    if (!TAG_PATTERN.test(normalized)) {
      throw new BadRequestException(
        `Etiqueta inválida: "${item}". Usa solo letras minúsculas, números y guiones (ej. matriculas, rondas-app).`,
      );
    }
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

/** Deduplica emails sin distinguir mayúsculas; conserva la primera forma. */
export function normalizeEmails(raw: string[]): string[] {
  if (raw.length > MAX_EMAILS) {
    throw new BadRequestException(`Máximo ${MAX_EMAILS} correos`);
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of raw) {
    if (typeof item !== 'string') {
      throw new BadRequestException('Cada correo debe ser un texto');
    }
    const trimmed = item.trim();
    if (trimmed.length === 0) {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

/** Deduplica teléfonos tras trim. */
export function normalizePhones(raw: string[]): string[] {
  if (raw.length > MAX_PHONES) {
    throw new BadRequestException(`Máximo ${MAX_PHONES} teléfonos`);
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of raw) {
    if (typeof item !== 'string') {
      throw new BadRequestException('Cada teléfono debe ser un texto');
    }
    const trimmed = item.trim();
    if (trimmed.length === 0) {
      continue;
    }
    if (trimmed.length > MAX_PHONE_LENGTH) {
      throw new BadRequestException(
        `Cada teléfono debe tener entre 1 y ${MAX_PHONE_LENGTH} caracteres`,
      );
    }
    if (seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}
