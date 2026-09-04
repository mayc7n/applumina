import { useColorScheme } from "react-native";

export const temaClaro = {
  escuro: false,
  cores: {
    marca: "#C63C24",
    marcaPressionada: "#A9321E",
    marcaSuave: "#FFF0EB",
    marcaContorno: "#F3B09E",
    sobreMarca: "#FFFFFF",
    fundo: "#FFFDFC",
    elevado: "#FFFFFF",
    sobreposicao: "#F8F4F1",
    texto: "#201A18",
    textoSecundario: "#695D57",
    textoSutil: "#8A7C75",
    borda: "#E9DED9",
    bordaForte: "#D7C8C1",
    sucesso: "#217A47",
    sucessoSuave: "#EAF6EF",
    alerta: "#8A4B0F",
    alertaSuave: "#FFF3DE",
    perigo: "#B42318",
    perigoSuave: "#FDEDEA",
    informacao: "#1769AA",
    informacaoSuave: "#EAF4FC",
    prioridadeBaixa: "#3976A8",
    prioridadeMedia: "#8A650D",
    prioridadeAlta: "#B34A19",
    prioridadeUrgente: "#9D2420",
    offline: "#5E6472",
    offlineSuave: "#EEF0F3",
  },
} as const;

export const temaEscuro = {
  escuro: true,
  cores: {
    marca: "#FF7652",
    marcaPressionada: "#FF8F70",
    marcaSuave: "#3B1912",
    marcaContorno: "#704033",
    sobreMarca: "#17100D",
    fundo: "#13110F",
    elevado: "#1B1816",
    sobreposicao: "#24201D",
    texto: "#FAF7F5",
    textoSecundario: "#C9BDB7",
    textoSutil: "#968983",
    borda: "#3A312D",
    bordaForte: "#51443E",
    sucesso: "#75D69A",
    sucessoSuave: "#173522",
    alerta: "#F6C56D",
    alertaSuave: "#3A2A11",
    perigo: "#FFB4AB",
    perigoSuave: "#421B18",
    informacao: "#9CCBFF",
    informacaoSuave: "#142D43",
    prioridadeBaixa: "#9CCBFF",
    prioridadeMedia: "#F6C56D",
    prioridadeAlta: "#FF9D78",
    prioridadeUrgente: "#FFB4AB",
    offline: "#BFC5D2",
    offlineSuave: "#292D35",
  },
} as const;

export type TemaApp = typeof temaClaro | typeof temaEscuro;

export function useTemaApp(): TemaApp {
  return useColorScheme() === "dark" ? temaEscuro : temaClaro;
}
