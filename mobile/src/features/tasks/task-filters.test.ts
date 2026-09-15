import { describe, expect, test } from "@jest/globals";

import { filtrarTarefas } from "./task-filters";
import type { Task } from "@/types/api";

const base: Omit<Task, "id" | "title" | "status"> = {
  priority: "NONE",
  labelIds: [],
  recurrenceType: "NONE",
  createdAt: "2030-06-10T10:00:00Z",
  updatedAt: "2030-06-10T10:00:00Z",
};

const tarefas: Task[] = [
  { ...base, id: "1", title: "Caminhar", status: "TODO", dueDate: "2030-06-10" },
  { ...base, id: "2", title: "Planejar reunião", status: "TODO", scheduledFor: "2030-06-12" },
  { ...base, id: "3", title: "Revisão", description: "Matéria de cálculo", status: "TODO", dueDate: "2030-06-09" },
  { ...base, id: "4", title: "Concluída", status: "DONE", dueDate: "2030-06-10" },
];

describe("filtros de tarefas", () => {
  test("mantém três filtros que priorizam a lista diária", () => {
    expect(filtrarTarefas(tarefas, "TODAY", "", "2030-06-10").map(({ id }) => id)).toEqual(["1"]);
    expect(filtrarTarefas(tarefas, "PENDING", "", "2030-06-10").map(({ id }) => id)).toEqual(["1", "2", "3"]);
    expect(filtrarTarefas(tarefas, "ALL", "", "2030-06-10").map(({ id }) => id)).toEqual(["1", "2", "3", "4"]);
  });

  test("busca sem depender de acentos", () => {
    expect(filtrarTarefas(tarefas, "ALL", "materia calculo", "2030-06-10").map(({ id }) => id)).toEqual(["3"]);
  });
});
