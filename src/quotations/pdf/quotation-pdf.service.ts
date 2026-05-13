import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import pdfMake from 'pdfmake';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { CompanyResponseDto } from '../../company/dto/company-response.dto';
import type { QuotationResponseDto } from '../dto/quotation-response.dto';
import { COLORS, DEFAULT_TERMS, IVA_RATE } from './quotation-pdf.constants';
import {
  buildQuoteNumber,
  formatCLP,
  formatDate,
} from './quotation-pdf.formatters';

const STANDARD_FONTS = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
} as const;

/** Nombres que PDFKit usa como fuentes estándar (no son rutas de disco). */
const PDFKIT_STANDARD_FONT_NAMES = new Set<string>(
  Object.values(STANDARD_FONTS.Helvetica),
);

type PdfMakeInstance = typeof pdfMake & {
  fonts: typeof STANDARD_FONTS;
  createPdf: (doc: TDocumentDefinitions) => {
    getBuffer: () => Promise<Buffer>;
  };
  setLocalAccessPolicy?: (cb: (path: string) => boolean) => void;
  setUrlAccessPolicy?: (cb: (url: string) => boolean) => void;
};

@Injectable()
export class QuotationPdfService implements OnModuleInit {
  private readonly logger = new Logger(QuotationPdfService.name);

  onModuleInit(): void {
    const pm = pdfMake as PdfMakeInstance;
    pm.fonts = STANDARD_FONTS;
    pm.setLocalAccessPolicy?.((path: string) =>
      PDFKIT_STANDARD_FONT_NAMES.has(path),
    );
    pm.setUrlAccessPolicy?.(() => false);
  }

  async generate(
    quotation: QuotationResponseDto,
    company: CompanyResponseDto,
    userId: string,
  ): Promise<Buffer> {
    const docDefinition = this.buildDocDefinition(quotation, company);
    const pm = pdfMake as PdfMakeInstance;
    const pdf = pm.createPdf(docDefinition);
    const buffer = await pdf.getBuffer();
    this.logger.log({
      msg: 'PDF de cotización generado',
      quotationId: quotation.id,
      userId,
      bytes: buffer.length,
    });
    return buffer;
  }

  private buildProjectSummary(quotation: QuotationResponseDto): string {
    const parts: string[] = [];
    if (quotation.projectTitle?.trim()) {
      parts.push(quotation.projectTitle.trim());
    }
    if (quotation.projectDeadline?.trim()) {
      parts.push(`Plazo: ${quotation.projectDeadline.trim()}`);
    }
    if (quotation.projectNotes?.trim()) {
      parts.push(quotation.projectNotes.trim());
    }
    return parts.length > 0 ? parts.join('\n\n') : '—';
  }

  private buildDocDefinition(
    quotation: QuotationResponseDto,
    company: CompanyResponseDto,
  ): TDocumentDefinitions {
    const quoteNumber = buildQuoteNumber(quotation.id);
    const emissionDate = formatDate(quotation.createdAt);
    const vu = quotation.validUntil?.trim();
    const validUntilLabel =
      vu && vu.length > 0
        ? formatDate(new Date(`${vu}T12:00:00.000Z`))
        : quotation.projectDeadline?.trim() || 'Sin fecha';
    const projectSummary = this.buildProjectSummary(quotation);

    const subtotalNet = quotation.total;
    const ivaAmount = Number((subtotalNet * IVA_RATE).toFixed(2));
    const totalWithIva = Number((subtotalNet + ivaAmount).toFixed(2));

    const companyLines: string[] = [`RUT: ${company.rut}`];
    if (company.address?.trim()) {
      companyLines.push(company.address.trim());
    }
    if (company.city?.trim()) {
      companyLines.push(company.city.trim());
    }
    if (company.contact?.trim()) {
      companyLines.push(company.contact.trim());
    }

    const clientStack: Content[] = [
      {
        text: 'CLIENTE',
        fontSize: 9,
        bold: true,
        color: COLORS.slate400,
        margin: [0, 0, 0, 6],
      },
      {
        text: quotation.clientName,
        fontSize: 13,
        bold: true,
        color: COLORS.slate900,
      },
    ];
    if (quotation.clientRut?.trim()) {
      clientStack.push({
        text: `RUT: ${quotation.clientRut.trim()}`,
        fontSize: 10,
        color: COLORS.slate600,
        margin: [0, 2, 0, 0],
      });
    }
    if (quotation.clientEmail?.trim()) {
      clientStack.push({
        text: quotation.clientEmail.trim(),
        fontSize: 10,
        color: COLORS.slate600,
        margin: [0, 2, 0, 0],
      });
    }

    const projectStack: Content[] = [
      {
        text: 'RESUMEN DEL PROYECTO',
        fontSize: 9,
        bold: true,
        color: COLORS.slate400,
        margin: [0, 0, 0, 6],
      },
      {
        text: projectSummary,
        fontSize: 10,
        italics: true,
        color: COLORS.slate700,
      },
    ];

    const itemRows = [...quotation.items].map((item) => [
      { text: item.description, color: COLORS.slate700, fontSize: 10 },
      {
        text: String(item.quantity),
        alignment: 'center' as const,
        color: COLORS.slate700,
        fontSize: 10,
      },
      {
        text: formatCLP(item.unitPrice),
        alignment: 'right' as const,
        color: COLORS.slate700,
        fontSize: 10,
      },
      {
        text: formatCLP(item.subtotal),
        alignment: 'right' as const,
        bold: true,
        color: COLORS.slate900,
        fontSize: 10,
      },
    ]);

    const termsList = [...DEFAULT_TERMS];
    const mid = Math.ceil(termsList.length / 2);
    const leftTerms = termsList.slice(0, mid);
    const rightTerms = termsList.slice(mid);

    const content = [
      {
        canvas: [
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: 515,
            h: 6,
            color: COLORS.emerald,
          },
        ],
        margin: [0, 0, 0, 20],
      },
      {
        columns: [
          {
            width: '*',
            columnGap: 10,
            columns: [
              {
                width: 36,
                table: {
                  widths: [36],
                  body: [
                    [
                      {
                        text: 'QF',
                        fillColor: COLORS.slate800,
                        color: '#ffffff',
                        bold: true,
                        fontSize: 11,
                        alignment: 'center',
                        margin: [0, 10, 0, 0],
                      },
                    ],
                  ],
                },
                layout: {
                  defaultBorder: false,
                },
              },
              {
                width: '*',
                stack: [
                  {
                    text: company.name,
                    bold: true,
                    fontSize: 13,
                    color: COLORS.slate900,
                  },
                  ...companyLines.map((line) => ({
                    text: line,
                    fontSize: 9,
                    color: COLORS.slate500,
                    margin: [0, 2, 0, 0],
                  })),
                ],
              },
            ],
          },
          {
            width: 220,
            stack: [
              {
                text: 'COTIZACION',
                alignment: 'right',
                bold: true,
                fontSize: 22,
                color: COLORS.slate900,
              },
              {
                text: quoteNumber,
                alignment: 'right',
                bold: true,
                fontSize: 13,
                color: COLORS.emerald,
                margin: [0, 2, 0, 0],
              },
              {
                text: `Fecha de Emisión: ${emissionDate}`,
                alignment: 'right',
                fontSize: 9,
                color: COLORS.slate500,
                margin: [0, 6, 0, 0],
              },
              {
                text: `Válido hasta: ${validUntilLabel}`,
                alignment: 'right',
                fontSize: 9,
                color: COLORS.slate500,
              },
            ],
          },
        ],
      },
      this.hr(),
      {
        columns: [
          { width: '*', stack: clientStack },
          { width: '*', stack: projectStack },
        ],
        columnGap: 24,
      },
      this.hr(),
      {
        table: {
          headerRows: 1,
          widths: ['*', 42, 88, 88],
          body: [
            [
              {
                text: 'DESCRIPCIÓN',
                bold: true,
                fontSize: 9,
                color: COLORS.slate500,
                border: [false, false, false, true],
                borderColor: [
                  COLORS.slate200,
                  COLORS.slate200,
                  COLORS.slate200,
                  COLORS.slate200,
                ],
                margin: [0, 0, 0, 8],
              },
              {
                text: 'CANT.',
                bold: true,
                fontSize: 9,
                color: COLORS.slate500,
                alignment: 'center',
                border: [false, false, false, true],
                borderColor: [
                  COLORS.slate200,
                  COLORS.slate200,
                  COLORS.slate200,
                  COLORS.slate200,
                ],
                margin: [0, 0, 0, 8],
              },
              {
                text: 'PRECIO UNIT.',
                bold: true,
                fontSize: 9,
                color: COLORS.slate500,
                alignment: 'right',
                border: [false, false, false, true],
                borderColor: [
                  COLORS.slate200,
                  COLORS.slate200,
                  COLORS.slate200,
                  COLORS.slate200,
                ],
                margin: [0, 0, 0, 8],
              },
              {
                text: 'TOTAL',
                bold: true,
                fontSize: 9,
                color: COLORS.slate500,
                alignment: 'right',
                border: [false, false, false, true],
                borderColor: [
                  COLORS.slate200,
                  COLORS.slate200,
                  COLORS.slate200,
                  COLORS.slate200,
                ],
                margin: [0, 0, 0, 8],
              },
            ],
            ...itemRows.map((row) =>
              row.map((cell) => ({
                ...cell,
                border: [false, false, false, true],
                borderColor: [
                  COLORS.slate100,
                  COLORS.slate100,
                  COLORS.slate100,
                  COLORS.slate100,
                ],
                margin: [0, 12, 0, 12],
              })),
            ),
          ],
        },
        layout: {
          defaultBorder: false,
        },
      },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 200,
            stack: [
              {
                columns: [
                  { text: 'Subtotal', color: COLORS.slate600, fontSize: 10 },
                  {
                    text: formatCLP(subtotalNet),
                    alignment: 'right',
                    color: COLORS.slate600,
                    fontSize: 10,
                  },
                ],
              },
              {
                columns: [
                  { text: 'IVA (19%)', color: COLORS.slate600, fontSize: 10 },
                  {
                    text: formatCLP(ivaAmount),
                    alignment: 'right',
                    color: COLORS.slate600,
                    fontSize: 10,
                  },
                ],
                margin: [0, 6, 0, 0],
              },
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 200,
                    y2: 0,
                    lineWidth: 1,
                    lineColor: '#cbd5e1',
                  },
                ],
                margin: [0, 8, 0, 8],
              },
              {
                columns: [
                  {
                    text: 'TOTAL',
                    bold: true,
                    fontSize: 11,
                    color: COLORS.slate900,
                  },
                  {
                    text: formatCLP(totalWithIva),
                    alignment: 'right',
                    bold: true,
                    fontSize: 11,
                    color: COLORS.slate900,
                  },
                ],
              },
            ],
          },
        ],
        margin: [0, 16, 0, 0],
      },
      this.hr(),
      {
        text: 'TÉRMINOS Y CONDICIONES',
        fontSize: 9,
        bold: true,
        color: COLORS.slate500,
        margin: [0, 0, 0, 12],
      },
      {
        columns: [
          {
            width: '*',
            ul: leftTerms,
            fontSize: 9,
            color: COLORS.slate600,
            markerColor: COLORS.slate400,
          },
          {
            width: '*',
            ul: rightTerms,
            fontSize: 9,
            color: COLORS.slate600,
            markerColor: COLORS.slate400,
          },
        ],
        columnGap: 24,
      },
      this.hr(),
      {
        columns: [
          {
            width: 200,
            stack: [
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 160,
                    y2: 0,
                    lineWidth: 1,
                    lineColor: COLORS.slate400,
                  },
                ],
                margin: [0, 0, 0, 4],
              },
              {
                text: 'Firma Aceptación Cliente',
                fontSize: 9,
                color: COLORS.slate500,
              },
            ],
          },
          {
            width: '*',
            text: `Documento generado electrónicamente por ${company.name}`,
            alignment: 'right',
            italics: true,
            fontSize: 9,
            color: COLORS.slate400,
            margin: [0, 8, 0, 0],
          },
        ],
      },
    ];

    return {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 50],
      defaultStyle: {
        font: 'Helvetica',
        color: COLORS.slate900,
        fontSize: 10,
      },
      content: content as TDocumentDefinitions['content'],
    };
  }

  private hr(): Content {
    return {
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 1,
          lineColor: COLORS.slate200,
        },
      ],
      margin: [0, 24, 0, 24],
    };
  }
}
