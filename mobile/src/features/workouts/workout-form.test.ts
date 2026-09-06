import { describe, expect, test } from "@jest/globals";

import {
  montarEntradaTreino,
  validarFormularioTreino,
  valoresIniciaisTreino,
} from "./workout-form";

const mensagens = {
  activityDate: "activityDate",
  durationMins: "durationMins",
  customActivity: "customActivity",
};

describe("formulário de treino", () => {
  test("valida data, duração e nome de atividade personalizada", () => {
    const valores = {
      ...valoresIniciaisTreino(new Date(2030, 5, 10)),
      type: "CUSTOM" as const,
      customActivity: " ",
      activityDate: "2030-02-30",
      durationMins: "0",
    };

    expect(validarFormularioTreino(valores, mensagens)).toEqual({
      activityDate: "activityDate",
      durationMins: "durationMins",
      customActivity: "customActivity",
    });
  });

  test("monta payload numérico e normaliza campos opcionais", () => {
    const valores = {
      ...valoresIniciaisTreino(new Date(2030, 5, 10)),
      type: "CUSTOM" as const,
      customActivity: "  Escalada indoor  ",
      durationMins: "75",
      notes: "  Primeira via completa  ",
    };

    expect(montarEntradaTreino(valores)).toEqual({
      type: "CUSTOM",
      customActivity: "Escalada indoor",
      activityDate: "2030-06-10",
      durationMins: 75,
      notes: "Primeira via completa",
    });
  });

  test("omite nome personalizado para modalidade predefinida", () => {
    const valores = {
      ...valoresIniciaisTreino(new Date(2030, 5, 10)),
      type: "RUNNING" as const,
      customActivity: "Ignorar",
      durationMins: "30",
    };

    expect(montarEntradaTreino(valores).customActivity).toBeUndefined();
  });
});
