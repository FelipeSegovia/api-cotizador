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
