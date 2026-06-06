import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';

export interface PasswordResetMailContext {
  name: string;
  code: string;
  expiresMinutes: number;
}

let compiledTemplate: HandlebarsTemplateDelegate | null = null;

export function renderPasswordResetCodeHtml(
  context: PasswordResetMailContext,
): string {
  if (!compiledTemplate) {
    const templatePath = join(
      __dirname,
      'templates',
      'password-reset-code.hbs',
    );
    compiledTemplate = Handlebars.compile(readFileSync(templatePath, 'utf8'), {
      strict: true,
    });
  }
  return compiledTemplate(context);
}
