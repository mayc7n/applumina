import { describe, expect, test } from "@jest/globals";

import {
  construirGradeMensal,
  formatarDataCalendario,
  obterIntervaloSemana,
} from "./workout-calendar";

describe("calendário de treinos", () => {
  test("constrói grade mensal completa começando na segunda em PT-BR", () => {
    const grade = construirGradeMensal(new Date(2030, 6, 1), "pt-BR");

    expect(grade.dias).toHaveLength(35);
    expect(formatarDataCalendario(grade.dias[0])).toBe("2030-07-01");
    expect(formatarDataCalendario(grade.dias.at(-1)!)).toBe("2030-08-04");
  });

  test("constrói semana iniciando no domingo em English", () => {
    const intervalo = obterIntervaloSemana(new Date(2030, 6, 3), "en");

    expect(formatarDataCalendario(intervalo.inicio)).toBe("2030-06-30");
    expect(formatarDataCalendario(intervalo.fim)).toBe("2030-07-06");
  });
});
