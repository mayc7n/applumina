import { addDays, format, parseISO, subDays } from "date-fns";

import type { DashboardData } from "@/types/api";

type DadosSemana = DashboardData["weeklyData"];

export interface DiaRitmo {
  id: string;
  data: Date;
  rotulo: string;
  ativo: boolean;
  hoje: boolean;
  rotuloAcessibilidade: string;
}

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

export function criarDiasRitmoSemana(
  dadosSemana: DadosSemana,
  dataAtual: Date,
  idioma: string,
  rotuloAtivo: string,
  rotuloVazio: string,
): DiaRitmo[] {
  const hoje = new Date(dataAtual);
  hoje.setHours(12, 0, 0, 0);
  const registros = new Map(
    dadosSemana.map((dia) => [dia.date.slice(0, 10), dia]),
  );
  const formatadorDia = new Intl.DateTimeFormat(idioma, { weekday: "short" });
  const formatadorData = new Intl.DateTimeFormat(idioma, {
    day: "2-digit",
    month: "2-digit",
  });

  return Array.from({ length: 7 }, (_, indice) => {
    const data = addDays(subDays(hoje, 6), indice);
    const id = format(data, "yyyy-MM-dd");
    const registro = registros.get(id);
    const ativo = Boolean(
      registro &&
        (registro.tasksCompleted > 0 ||
          registro.habitRate > 0 ||
          registro.focusMins > 0),
    );
    const rotulo = formatadorDia.format(data).replace(/\.$/, "");
    const dataFormatada = formatadorData.format(parseISO(`${id}T12:00:00`));
    const modelo = ativo ? rotuloAtivo : rotuloVazio;

    return {
      id,
      data,
      rotulo,
      ativo,
      hoje: id === format(hoje, "yyyy-MM-dd"),
      rotuloAcessibilidade: modelo
        .replace("{dia}", rotulo)
        .replace("{data}", dataFormatada),
    };
  });
}
