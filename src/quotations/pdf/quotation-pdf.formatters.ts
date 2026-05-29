const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export function formatCLP(value: number): string {
  return clpFormatter.format(Math.round(value));
}

export function formatDate(value: Date): string {
  return dateFormatter.format(value);
}

export function buildQuoteNumber(quotationId: string): string {
  return `COT-${quotationId.slice(0, 8).toUpperCase()}`;
}

/**
 * Formatea un RUT chileno aplicando separadores de miles y guión
 * antes del dígito verificador (ej: "123456789" -> "12.345.678-9").
 * Si el valor no contiene un RUT válido, se devuelve tal cual fue ingresado.
 */
export function formatRut(value: string | null | undefined): string {
  if (!value) return '';
  const original = value.trim();
  if (original.length === 0) return '';

  const clean = original.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return original;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);

  if (!/^\d+$/.test(body)) return original;

  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
}
