import { describe, expect, jest, test } from "@jest/globals";
import type { ReactElement, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type TextProps, type ViewStyle } from "react-native";

import { LanguageSelector } from "./language-selector";

jest.mock("@/theme/theme", () => ({
  useTemaApp: () => ({
    cores: {
      borda: "#d4d4d8",
      marca: "#5b21b6",
      marcaSuave: "#ede9fe",
      sobreMarca: "#ffffff",
      sobreposicao: "#f4f4f5",
      texto: "#18181b",
      textoSecundario: "#52525b",
    },
  }),
}));

type Elemento = ReactElement<{
  accessibilityRole?: string;
  accessibilityState?: { checked?: boolean; disabled?: boolean; selected?: boolean };
  children?: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  style?: TextProps["style"] | ((estado: { pressed: boolean }) => ViewStyle[]);
  numberOfLines?: number;
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
}>;

function elementosDoTipo(elemento: ReactNode, tipo: unknown): Elemento[] {
  if (Array.isArray(elemento)) {
    return elemento.flatMap((filho) => elementosDoTipo(filho, tipo));
  }
  if (!elemento || typeof elemento !== "object" || !("props" in elemento)) return [];
  const atual = elemento as Elemento;
  return [
    ...(atual.type === tipo ? [atual] : []),
    ...elementosDoTipo(atual.props.children, tipo),
  ];
}

describe("LanguageSelector", () => {
  test("expõe opções de idioma exclusivas, seleciona português e troca para inglês", () => {
    const aoMudar = jest.fn();
    const seletor = LanguageSelector({
      idioma: "pt-BR",
      salvando: false,
      onChange: aoMudar,
      rotuloIngles: "English",
      rotuloPortugues: "Português (Brasil)",
    });
    const opcoes = elementosDoTipo(seletor, Pressable);
    const rotulos = elementosDoTipo(seletor, Text).map((texto) => texto.props.children);

    expect(rotulos).toEqual(expect.arrayContaining(["Português (Brasil)", "English"]));
    expect(opcoes).toHaveLength(2);
    expect(opcoes[0].props.accessibilityRole).toBe("radio");
    expect(opcoes[0].props.accessibilityState).toMatchObject({ selected: true, checked: true });
    expect(opcoes[1].props.accessibilityState).toMatchObject({ selected: false, checked: false });

    opcoes[1].props.onPress?.();

    expect(aoMudar).toHaveBeenCalledWith("en");
  });

  test("desabilita ambas as opções durante o salvamento", () => {
    const seletor = LanguageSelector({
      idioma: "en",
      salvando: true,
      onChange: jest.fn(),
      rotuloIngles: "English",
      rotuloPortugues: "Português (Brasil)",
    });

    for (const opcao of elementosDoTipo(seletor, Pressable)) {
      expect(opcao.props.disabled).toBe(true);
      expect(opcao.props.accessibilityState).toMatchObject({ disabled: true });
    }
  });

  test("acomoda rótulos longos e fontes ampliadas sem limitar linhas ou altura", () => {
    const rotuloLongo = "Português (Brasil) — preferência de idioma para toda a conta";
    const seletor = LanguageSelector({
      idioma: "en",
      salvando: false,
      onChange: jest.fn(),
      rotuloIngles: "English — preferred language for the entire account",
      rotuloPortugues: rotuloLongo,
    });
    const opcoes = elementosDoTipo(seletor, Pressable);
    expect(opcoes[1].props.accessibilityState).toMatchObject({ selected: true, checked: true });
    expect(elementosDoTipo(seletor, Text)[0].props.children).toBe(rotuloLongo);

    for (const opcao of opcoes) {
      const estilo = opcao.props.style;
      const caixa = StyleSheet.flatten(typeof estilo === "function" ? estilo({ pressed: false }) : estilo);
      expect(caixa).toMatchObject({ minHeight: 44, paddingVertical: 12 });
      expect(caixa?.height).toBeUndefined();
      expect(caixa?.maxHeight).toBeUndefined();
      expect(caixa?.overflow).not.toBe("hidden");
      const indicador = elementosDoTipo(opcao, View)[0];
      expect(StyleSheet.flatten(indicador.props.style as ViewStyle)).toMatchObject({ flexShrink: 0 });
    }
    for (const rotulo of elementosDoTipo(seletor, Text)) {
      expect(StyleSheet.flatten(rotulo.props.style as TextProps["style"])).toMatchObject({ flex: 1, flexShrink: 1 });
      expect(rotulo.props.numberOfLines).toBeUndefined();
      expect(rotulo.props.allowFontScaling).not.toBe(false);
      expect(rotulo.props.maxFontSizeMultiplier).toBeUndefined();
    }
  });
});
