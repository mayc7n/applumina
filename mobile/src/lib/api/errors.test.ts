import { describe, expect, test } from '@jest/globals';

import { AxiosError } from 'axios';

import {
  classificarFalhaApi,
  ErroConfiguracaoApi,
  obterMensagemErroApi,
} from './errors';

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

  test.each([
    [new AxiosError('Network Error', 'ERR_NETWORK'), 'semConexao'],
    [new AxiosError('timeout exceeded', 'ECONNABORTED'), 'timeout'],
    [
      new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: { headers: {} } as never,
        data: { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'x' } },
      }),
      'credenciais',
    ],
    [
      new AxiosError('Unavailable', 'ERR_BAD_RESPONSE', undefined, undefined, {
        status: 503,
        statusText: 'Unavailable',
        headers: {},
        config: { headers: {} } as never,
        data: { success: false },
      }),
      'indisponivel',
    ],
    [new ErroConfiguracaoApi(), 'configuracao'],
    [new Error('outro'), 'desconhecido'],
  ])('classifica falha de autenticação sem misturar causas', (erro, motivo) => {
    expect(classificarFalhaApi(erro)).toBe(motivo);
  });
});
