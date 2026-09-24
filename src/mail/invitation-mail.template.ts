import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';

export interface InvitationMailContext {
  name: string;
  companyName: string;
  roleLabel: string;
  inviteUrl: string;
  expiresDays: number;
}

let compiledTemplate: HandlebarsTemplateDelegate | null = null;

export function renderInvitationHtml(context: InvitationMailContext): string {
  if (!compiledTemplate) {
    const templatePath = join(__dirname, 'templates', 'invitation.hbs');
    compiledTemplate = Handlebars.compile(readFileSync(templatePath, 'utf8'), {
      strict: true,
    });
  }
  return compiledTemplate(context);
}
