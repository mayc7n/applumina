import { useColorScheme } from "react-native";

export const temaClaro = {
  escuro: false,
  cores: {
    fundo: "#FFFFFF",
    elevado: "#FAFAFB",
    sobreposicao: "#F3F4F6",
    texto: "#17191F",
    textoSecundario: "#5B606B",
    textoSutil: "#8A909C",
    borda: "#E5E7EB",
    bordaForte: "#D1D5DB",
    marca: "#6D5CE7",
    marcaSuave: "#EFEDFF",
    sobreMarca: "#FFFFFF",
    sucesso: "#16A34A",
    sucessoSuave: "#EAF8EF",
    perigo: "#DC2626",
    perigoSuave: "#FEF2F2",
    alerta: "#D97706",
  },
} as const;

export const temaEscuro = {
  escuro: true,
  cores: {
    fundo: "#121318",
    elevado: "#191B21",
    sobreposicao: "#22242C",
    texto: "#F6F7F9",
    textoSecundario: "#A6ABB5",
    textoSutil: "#737986",
    borda: "#292C35",
    bordaForte: "#393D48",
    marca: "#8273F0",
    marcaSuave: "#262247",
    sobreMarca: "#FFFFFF",
    sucesso: "#4ADE80",
    sucessoSuave: "#153521",
    perigo: "#F87171",
    perigoSuave: "#3A1B1F",
    alerta: "#FBBF24",
  },
} as const;

export type TemaApp = typeof temaClaro | typeof temaEscuro;

export function useTemaApp(): TemaApp {
  return useColorScheme() === "dark" ? temaEscuro : temaClaro;
}
