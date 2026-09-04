import { describe, expect, test } from '@jest/globals';

import { criarEsquemaCadastro, criarEsquemaLogin } from './schemas';

type Traduzir = Parameters<typeof criarEsquemaLogin>[0];

const traduzir = ((chave: string) => chave) as Traduzir;

describe('esquemas de autenticação', () => {
  test('aceita credenciais de login válidas', () => {
    const resultado = criarEsquemaLogin(traduzir).safeParse({
      email: 'user@example.com',
      password: 'senha-segura',
    });

    expect(resultado.success).toBe(true);
  });

  test('recusa nome de usuário incompatível com o contrato do backend', () => {
    const resultado = criarEsquemaCadastro(traduzir).safeParse({
      displayName: 'Pessoa Exemplo',
      username: 'Nome Com Espaço',
      email: 'user@example.com',
      password: 'senha-segura',
      confirmPassword: 'senha-segura',
    });

    expect(resultado.success).toBe(false);
  });

  test('recusa confirmação de senha diferente', () => {
    const resultado = criarEsquemaCadastro(traduzir).safeParse({
      displayName: 'Pessoa Exemplo',
      username: 'pessoa_exemplo',
      email: 'user@example.com',
      password: 'senha-segura',
      confirmPassword: 'outra-senha',
    });

    expect(resultado.success).toBe(false);
  });
});
