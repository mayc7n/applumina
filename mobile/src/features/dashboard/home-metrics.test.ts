import { describe, expect, test } from "@jest/globals";

import { resumirSemana } from "./home-metrics";

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
});
