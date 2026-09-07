import { describe, expect, test } from "@jest/globals";

import { chavesTarefasUsuario } from "./task-query-keys";

describe("cache privado de tarefas", () => {
  test("isola tarefas, painel, projetos e etiquetas pela identidade autenticada", () => {
    const primeiraConta = chavesTarefasUsuario("usuario-a");
    const segundaConta = chavesTarefasUsuario("usuario-b");

    expect(primeiraConta.lista).toEqual(["tarefas", "usuario-a", "lista"]);
    expect(primeiraConta.detalhe("tarefa-1")).toEqual([
      "tarefas",
      "usuario-a",
      "detalhe",
      "tarefa-1",
    ]);
    expect(primeiraConta.painel).toEqual(["painel", "usuario-a"]);
    expect(primeiraConta.projetos).toEqual([
      "projetos-tarefa",
      "usuario-a",
    ]);
    expect(primeiraConta.etiquetas).toEqual([
      "etiquetas-tarefa",
      "usuario-a",
    ]);
    expect(primeiraConta.lista).not.toEqual(segundaConta.lista);
    expect(primeiraConta.detalhe("tarefa-1")).not.toEqual(
      segundaConta.detalhe("tarefa-1"),
    );
    expect(primeiraConta.painel).not.toEqual(segundaConta.painel);
    expect(primeiraConta.projetos).not.toEqual(segundaConta.projetos);
    expect(primeiraConta.etiquetas).not.toEqual(segundaConta.etiquetas);
  });
});
