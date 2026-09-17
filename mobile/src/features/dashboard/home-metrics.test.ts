import { describe, expect, test } from "@jest/globals";

import { criarDiasRitmoSemana, resumirSemana } from "./home-metrics";

describe("resumo bento da semana", () => {
  test("calcula dias ativos, tarefas e foco com dados reais do painel", () => {
    expect(
      resumirSemana([
        {
          date: "2030-01-01",
          tasksCompleted: 2,
          habitRate: 0,
          focusMins: 25,
          productivityScore: 40,
        },
        {
          date: "2030-01-02",
          tasksCompleted: 0,
          habitRate: 0.5,
          focusMins: 0,
          productivityScore: 30,
        },
        {
          date: "2030-01-03",
          tasksCompleted: 0,
          habitRate: 0,
          focusMins: 0,
          productivityScore: 0,
        },
      ]),
    ).toEqual({ diasAtivos: 2, tarefasConcluidas: 2, minutosFoco: 25 });
  });

  test("monta sete dias em ordem e marca o registro de hoje", () => {
    const dias = criarDiasRitmoSemana(
      [
        {
          date: "2030-01-02",
          tasksCompleted: 0,
          habitRate: 0,
          focusMins: 20,
          productivityScore: 30,
        },
        {
          date: "2030-01-04",
          tasksCompleted: 1,
          habitRate: 0,
          focusMins: 0,
          productivityScore: 40,
        },
      ],
      new Date(2030, 0, 7, 12),
      "pt-BR",
      "{dia} {data}: com registro",
      "{dia} {data}: sem registro",
    );

    expect(dias).toHaveLength(7);
    expect(dias.map((dia) => dia.id)).toEqual([
      "2030-01-01",
      "2030-01-02",
      "2030-01-03",
      "2030-01-04",
      "2030-01-05",
      "2030-01-06",
      "2030-01-07",
    ]);
    expect(dias.map((dia) => dia.ativo)).toEqual([
      false,
      true,
      false,
      true,
      false,
      false,
      false,
    ]);
    expect(dias.filter((dia) => dia.hoje)).toHaveLength(1);
    expect(dias.at(-1)?.hoje).toBe(true);
    expect(dias[1].rotuloAcessibilidade).toContain("com registro");
  });

  test("completa uma semana vazia sem inventar atividade", () => {
    const dias = criarDiasRitmoSemana(
      [],
      new Date(2030, 0, 7, 12),
      "en",
      "{dia} {data}: recorded",
      "{dia} {data}: no record",
    );

    expect(dias).toHaveLength(7);
    expect(dias.every((dia) => !dia.ativo)).toBe(true);
    expect(dias.filter((dia) => dia.hoje)).toHaveLength(1);
    expect(dias[0].rotuloAcessibilidade).toContain("no record");
  });
});
