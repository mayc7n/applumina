import type { CreateWorkoutInput, WorkoutType } from "@/types/api";

export interface ValoresFormularioTreino {
  type: WorkoutType;
  customActivity: string;
  activityDate: string;
  durationMins: string;
  notes: string;
}

export type ErrosFormularioTreino = Partial<
  Record<"activityDate" | "durationMins" | "customActivity", string>
>;

function dataLocal(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function dataValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  return (
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia
  );
}

export function valoresIniciaisTreino(
  hoje = new Date(),
): ValoresFormularioTreino {
  return {
    type: "WALKING",
    customActivity: "",
    activityDate: dataLocal(hoje),
    durationMins: "",
    notes: "",
  };
}

export function validarFormularioTreino(
  valores: ValoresFormularioTreino,
  mensagens: {
    activityDate: string;
    durationMins: string;
    customActivity: string;
  },
): ErrosFormularioTreino {
  const erros: ErrosFormularioTreino = {};
  if (!dataValida(valores.activityDate)) {
    erros.activityDate = mensagens.activityDate;
  }
  const duracao = Number(valores.durationMins);
  if (
    !valores.durationMins ||
    !Number.isInteger(duracao) ||
    duracao < 1 ||
    duracao > 1_440
  ) {
    erros.durationMins = mensagens.durationMins;
  }
  const nomePersonalizado = valores.customActivity.trim();
  if (
    valores.type === "CUSTOM" &&
    (nomePersonalizado.length < 2 || nomePersonalizado.length > 100)
  ) {
    erros.customActivity = mensagens.customActivity;
  }
  return erros;
}

export function montarEntradaTreino(
  valores: ValoresFormularioTreino,
): CreateWorkoutInput {
  const customActivity = valores.customActivity.trim();
  const notes = valores.notes.trim();
  return {
    type: valores.type,
    customActivity:
      valores.type === "CUSTOM" ? customActivity : undefined,
    activityDate: valores.activityDate,
    durationMins: Number(valores.durationMins),
    notes: notes || undefined,
  };
}
