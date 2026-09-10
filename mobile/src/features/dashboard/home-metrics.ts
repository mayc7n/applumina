import type { DashboardData } from "@/types/api";

type DadosSemana = DashboardData["weeklyData"];

export function resumirSemana(dadosSemana: DadosSemana) {
  return dadosSemana.reduce(
    (resumo, dia) => ({
      diasAtivos:
        resumo.diasAtivos +
        Number(
          dia.tasksCompleted > 0 || dia.habitRate > 0 || dia.focusMins > 0,
        ),
      tarefasConcluidas: resumo.tarefasConcluidas + dia.tasksCompleted,
      minutosFoco: resumo.minutosFoco + dia.focusMins,
    }),
    { diasAtivos: 0, tarefasConcluidas: 0, minutosFoco: 0 },
  );
}
