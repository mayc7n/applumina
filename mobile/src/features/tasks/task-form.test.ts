import { describe, expect, test } from "@jest/globals";

import {
  montarEntradaTarefa,
  validarFormularioTarefa,
  valoresIniciaisTarefa,
} from "./task-form";

const mensagens = {
  title: "title",
  dueDate: "dueDate",
  dueTime: "dueTime",
  scheduledFor: "scheduledFor",
  estimatedMins: "estimatedMins",
  reminder: "reminder",
};

describe("formulário de tarefa", () => {
  test("valida campos antes de enviar", () => {
    const valores = {
      ...valoresIniciaisTarefa(),
      dueDate: "2030-02-30",
      dueTime: "25:00",
      estimatedMins: "0",
      remindAtDueTime: true,
    };

    expect(validarFormularioTarefa(valores, mensagens)).toEqual({
      title: "title",
      dueDate: "dueDate",
      dueTime: "dueTime",
      estimatedMins: "estimatedMins",
      reminder: "reminder",
    });
  });

  test("monta lembrete no fuso local e preserva campos que devem ser limpos", () => {
    const valores = {
      ...valoresIniciaisTarefa(),
      title: "Caminhar",
      dueDate: "2030-06-10",
      dueTime: "19:00",
      remindAtDueTime: true,
    };

    const entrada = montarEntradaTarefa(valores, true);

    expect(entrada.title).toBe("Caminhar");
    expect(entrada.reminderAt).toBe(new Date("2030-06-10T19:00:00").toISOString());
    expect(entrada.projectId).toBe("");
    expect(entrada.estimatedMins).toBe(0);
  });
});
