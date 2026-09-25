import { BadRequestException } from '@nestjs/common';
import {
  normalizeEmails,
  normalizePhones,
  normalizeTags,
} from './client-fields.util';

describe('client-fields.util', () => {
  describe('normalizeTags', () => {
    it('normaliza, deduplica y convierte espacios a guion', () => {
      expect(normalizeTags(['Rondas App', 'matriculas', 'matriculas'])).toEqual([
        'rondas-app',
        'matriculas',
      ]);
    });

    it('rechaza caracteres inválidos', () => {
      expect(() => normalizeTags(['foo_bar'])).toThrow(BadRequestException);
    });
  });

  describe('normalizeEmails', () => {
    it('deduplica sin distinguir mayúsculas', () => {
      expect(
        normalizeEmails(['Ana@Test.com', 'ana@test.com', 'other@test.com']),
      ).toEqual(['Ana@Test.com', 'other@test.com']);
    });
  });

  describe('normalizePhones', () => {
    it('deduplica tras trim', () => {
      expect(normalizePhones([' 123 ', '123', '456'])).toEqual(['123', '456']);
    });
  });
});
