import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTemaApp } from "@/theme/theme";
import type { IdiomaApp } from "@/types/api";

interface LanguageSelectorProps {
  idioma: IdiomaApp;
  salvando: boolean;
  onChange: (idioma: IdiomaApp) => void;
  rotuloIngles: string;
  rotuloPortugues: string;
}

export function LanguageSelector({
  idioma,
  salvando,
  onChange,
  rotuloIngles,
  rotuloPortugues,
}: LanguageSelectorProps) {
  const tema = useTemaApp();
  const opcoes: readonly { idioma: IdiomaApp; rotulo: string }[] = [
    { idioma: "pt-BR", rotulo: rotuloPortugues },
    { idioma: "en", rotulo: rotuloIngles },
  ];

  return (
    <View accessibilityRole="radiogroup" style={styles.grupo}>
      {opcoes.map((opcao) => {
        const selecionada = opcao.idioma === idioma;

        return (
          <Pressable
            accessibilityLabel={opcao.rotulo}
            accessibilityRole="radio"
            accessibilityState={{
              checked: selecionada,
              disabled: salvando,
              selected: selecionada,
            }}
            disabled={salvando}
            hitSlop={6}
            key={opcao.idioma}
            onPress={() => onChange(opcao.idioma)}
            style={({ pressed }) => [
              styles.opcao,
              {
                backgroundColor: selecionada
                  ? tema.cores.marcaSuave
                  : pressed
                    ? tema.cores.sobreposicao
                    : "transparent",
                borderColor: selecionada ? tema.cores.marca : tema.cores.borda,
                opacity: salvando ? 0.5 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.indicador,
                {
                  backgroundColor: selecionada ? tema.cores.marca : "transparent",
                  borderColor: selecionada ? tema.cores.marca : tema.cores.borda,
                },
              ]}
            />
            <Text
              style={[
                styles.rotulo,
                { color: selecionada ? tema.cores.texto : tema.cores.textoSecundario },
              ]}
            >
              {opcao.rotulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  indicador: {
    flexShrink: 0,
    borderRadius: 8,
    borderWidth: 1,
    height: 16,
    width: 16,
  },
  opcao: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rotulo: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "600",
  },
});
