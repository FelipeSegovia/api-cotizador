import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';
import type { UserCredentialsMailContext } from './mail-credentials.util';

let compiledTemplate: HandlebarsTemplateDelegate | null = null;

export function renderUserCredentialsHtml(
  context: UserCredentialsMailContext,
): string {
  if (!compiledTemplate) {
    const templatePath = join(__dirname, 'templates', 'user-credentials.hbs');
    compiledTemplate = Handlebars.compile(readFileSync(templatePath, 'utf8'), {
      strict: true,
    });
  }
  return compiledTemplate(context);
}
