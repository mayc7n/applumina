import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export interface IntervaloCalendario {
  inicio: Date;
  fim: Date;
  dias: Date[];
}

function primeiroDiaSemana(idioma: string): 0 | 1 {
  return idioma === "en" ? 0 : 1;
}

export function formatarDataCalendario(data: Date): string {
  return format(data, "yyyy-MM-dd");
}

export function obterIntervaloSemana(
  data: Date,
  idioma: string,
): IntervaloCalendario {
  const options = { weekStartsOn: primeiroDiaSemana(idioma) as 0 | 1 };
  const inicio = startOfWeek(data, options);
  const fim = endOfWeek(data, options);
  return { inicio, fim, dias: eachDayOfInterval({ start: inicio, end: fim }) };
}

export function construirGradeMensal(
  mesReferencia: Date,
  idioma: string,
): IntervaloCalendario {
  const options = { weekStartsOn: primeiroDiaSemana(idioma) as 0 | 1 };
  const inicio = startOfWeek(startOfMonth(mesReferencia), options);
  const fim = endOfWeek(endOfMonth(mesReferencia), options);
  return { inicio, fim, dias: eachDayOfInterval({ start: inicio, end: fim }) };
}
