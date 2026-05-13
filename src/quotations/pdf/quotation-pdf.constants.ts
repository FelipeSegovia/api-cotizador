/** IVA mostrado en el PDF (el total almacenado en BD es neto). */
export const IVA_RATE = 0.19;

export const DEFAULT_TERMS = [
  'Validez de la oferta: 30 días desde la emisión.',
  'Forma de pago: 50% al inicio, 50% al término.',
  'Tiempos sujetos a aprobaciones del cliente.',
  'Cambios fuera del alcance se cotizan aparte.',
] as const;

export const COLORS = {
  emerald: '#059669',
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
} as const;
