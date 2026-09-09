export function criarMovimento(reduzirMovimento: boolean) {
  return {
    entrada: {
      deslocamentoY: reduzirMovimento ? 0 : 8,
      duracao: reduzirMovimento ? 0 : 220,
    },
    pressao: {
      duracao: reduzirMovimento ? 0 : 90,
      escala: reduzirMovimento ? 1 : 0.98,
    },
  } as const;
}

export const formaInterface = {
  raioBotao: 14,
} as const;
