import { describe, expect, test } from '@jest/globals';

import { ErroConfiguracaoApi, obterMensagemErroApi } from './errors';

describe('mensagens de erro da API', () => {
  test('explica quando a URL da API não foi configurada', () => {
    expect(obterMensagemErroApi(new ErroConfiguracaoApi())).toContain('EXPO_PUBLIC_API_URL');
  });

  test('preserva erro conhecido sem expor detalhes internos adicionais', () => {
    expect(obterMensagemErroApi(new Error('Sessão não encontrada.'))).toBe(
      'Sessão não encontrada.',
    );
  });

  test('usa mensagem segura para valor desconhecido', () => {
    expect(obterMensagemErroApi(null, 'Falha segura.')).toBe('Falha segura.');
  });

  test('preserva a tradução local quando a mensagem do servidor não deve aparecer', () => {
    expect(obterMensagemErroApi(new Error('Server detail'), 'Falha local.', false)).toBe(
      'Falha local.',
    );
  });
});
