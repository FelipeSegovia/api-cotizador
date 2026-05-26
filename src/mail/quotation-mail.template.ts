import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';
import type { QuotationMailContext } from './mail.types';

let compiledTemplate: HandlebarsTemplateDelegate | null = null;

export function renderQuotationSentHtml(
  context: QuotationMailContext & { projectTitle: string },
): string {
  if (!compiledTemplate) {
    const templatePath = join(__dirname, 'templates', 'quotation-sent.hbs');
    compiledTemplate = Handlebars.compile(readFileSync(templatePath, 'utf8'), {
      strict: true,
    });
  }
  return compiledTemplate(context);
}
