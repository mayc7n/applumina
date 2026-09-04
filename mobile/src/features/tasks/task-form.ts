import type { CreateTaskInput, Task } from "@/types/api";

export interface ValoresFormularioTarefa {
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  dueTime: string;
  scheduledFor: string;
  estimatedMins: string;
  projectId: string;
  labelIds: string[];
  recurrenceType: string;
  remindAtDueTime: boolean;
}

export type ErrosFormularioTarefa = Partial<
  Record<"title" | "dueDate" | "dueTime" | "scheduledFor" | "estimatedMins" | "reminder", string>
>;

function dataValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
}

function horarioValido(valor: string): boolean {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(valor)) return false;
  return true;
}

export function valoresIniciaisTarefa(tarefa?: Task): ValoresFormularioTarefa {
  return {
    title: tarefa?.title ?? "",
    description: tarefa?.description ?? "",
    priority: tarefa?.priority ?? "NONE",
    dueDate: tarefa?.dueDate ?? "",
    dueTime: tarefa?.dueTime?.slice(0, 5) ?? "",
    scheduledFor: tarefa?.scheduledFor ?? "",
    estimatedMins: tarefa?.estimatedMins?.toString() ?? "",
    projectId: tarefa?.projectId ?? "",
    labelIds: tarefa?.labelIds ?? [],
    recurrenceType: tarefa?.recurrenceType ?? "NONE",
    remindAtDueTime: Boolean(tarefa?.reminderAt),
  };
}

export function validarFormularioTarefa(
  valores: ValoresFormularioTarefa,
  mensagens: {
    title: string;
    dueDate: string;
    dueTime: string;
    scheduledFor: string;
    estimatedMins: string;
    reminder: string;
  },
): ErrosFormularioTarefa {
  const erros: ErrosFormularioTarefa = {};
  if (!valores.title.trim()) erros.title = mensagens.title;
  if (valores.dueDate && !dataValida(valores.dueDate)) erros.dueDate = mensagens.dueDate;
  if (valores.dueTime && !horarioValido(valores.dueTime)) erros.dueTime = mensagens.dueTime;
  if (valores.scheduledFor && !dataValida(valores.scheduledFor)) erros.scheduledFor = mensagens.scheduledFor;
  const minutos = Number(valores.estimatedMins);
  if (valores.estimatedMins && (!Number.isInteger(minutos) || minutos < 1 || minutos > 10_080)) {
    erros.estimatedMins = mensagens.estimatedMins;
  }
  if (valores.remindAtDueTime && (!valores.dueDate || !horarioValido(valores.dueTime))) {
    erros.reminder = mensagens.reminder;
  }
  return erros;
}

export function montarEntradaTarefa(
  valores: ValoresFormularioTarefa,
  incluirVazios = false,
): CreateTaskInput {
  const opcional = (valor: string): string | undefined =>
    valor || (incluirVazios ? "" : undefined);
  const reminderAt = valores.remindAtDueTime
    ? new Date(`${valores.dueDate}T${valores.dueTime}:00`).toISOString()
    : incluirVazios
      ? ""
      : undefined;

  return {
    title: valores.title.trim(),
    description: opcional(valores.description.trim()),
    priority: valores.priority,
    dueDate: opcional(valores.dueDate),
    dueTime: opcional(valores.dueTime),
    scheduledFor: opcional(valores.scheduledFor),
    estimatedMins: valores.estimatedMins
      ? Number(valores.estimatedMins)
      : incluirVazios
        ? 0
        : undefined,
    projectId: opcional(valores.projectId),
    labelIds: valores.labelIds,
    recurrenceType: valores.recurrenceType,
    reminderAt,
  };
}
