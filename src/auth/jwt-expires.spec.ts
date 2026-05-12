import { jwtExpiresInSeconds, jwtExpiresInString } from './jwt-expires';

describe('jwt-expires helpers', () => {
  afterEach(() => delete process.env.JWT_EXPIRES_IN);

  it('usa 900s por defecto cuando JWT_EXPIRES_IN no está definido', () => {
    delete process.env.JWT_EXPIRES_IN;
    expect(jwtExpiresInString()).toBe('900s');
    expect(jwtExpiresInSeconds()).toBe(900);
  });

  it('parsea unidades hora y minuto', () => {
    process.env.JWT_EXPIRES_IN = '2m';
    expect(jwtExpiresInSeconds()).toBe(120);
    process.env.JWT_EXPIRES_IN = '1h';
    expect(jwtExpiresInSeconds()).toBe(3600);
  });
});
