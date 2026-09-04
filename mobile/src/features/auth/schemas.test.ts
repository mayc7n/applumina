import { describe, expect, test } from '@jest/globals';

import {
  criarEsquemaCadastro,
  criarEsquemaAlteracaoSenha,
  criarEsquemaRecuperacaoSenha,
  criarEsquemaRedefinicaoSenha,
  criarEsquemaExclusaoConta,
  criarEsquemaLogin,
} from './schemas';

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

  test('exige e-mail válido e senha para excluir a conta', () => {
    const esquema = criarEsquemaExclusaoConta(traduzir);

    expect(esquema.safeParse({ confirmation: 'invalido', password: '' }).success)
      .toBe(false);
    expect(esquema.safeParse({
      confirmation: 'user@example.com',
      password: 'senha-segura',
    }).success).toBe(true);
  });

  test('exige confirmação e uma senha nova diferente da atual', () => {
    const esquema = criarEsquemaAlteracaoSenha(traduzir);

    expect(esquema.safeParse({
      currentPassword: 'senha-segura',
      newPassword: 'senha-segura',
      confirmPassword: 'senha-segura',
    }).success).toBe(false);
    expect(esquema.safeParse({
      currentPassword: 'senha-segura',
      newPassword: 'senha-nova-segura',
      confirmPassword: 'outra-senha',
    }).success).toBe(false);
    expect(esquema.safeParse({
      currentPassword: 'senha-segura',
      newPassword: 'senha-nova-segura',
      confirmPassword: 'senha-nova-segura',
    }).success).toBe(true);
  });

  test('valida pedido e redefinição de senha', () => {
    expect(criarEsquemaRecuperacaoSenha(traduzir).safeParse({ email: 'invalido' }).success).toBe(false);
    expect(criarEsquemaRecuperacaoSenha(traduzir).safeParse({ email: 'user@example.com' }).success).toBe(true);
    expect(criarEsquemaRedefinicaoSenha(traduzir).safeParse({
      newPassword: 'senha-segura', confirmPassword: 'outra',
    }).success).toBe(false);
    expect(criarEsquemaRedefinicaoSenha(traduzir).safeParse({
      newPassword: 'senha-segura', confirmPassword: 'senha-segura',
    }).success).toBe(true);
  });
});
