import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";

import { useTemaApp } from "@/theme/theme";

type ButtonVariant = "primary" | "secondary" | "danger";

interface AppButtonProps extends PressableProps {
  rotulo: string;
  carregando?: boolean;
  variante?: ButtonVariant;
}

export function AppButton({
  rotulo,
  carregando = false,
  variante = "primary",
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const tema = useTemaApp();
  const corFundo =
    variante === "primary"
      ? tema.cores.marca
      : variante === "danger"
        ? tema.cores.perigo
        : tema.cores.sobreposicao;
  const cor =
    variante === "secondary" ? tema.cores.texto : tema.cores.sobreMarca;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: Boolean(disabled || carregando),
        busy: carregando,
      }}
      disabled={disabled || carregando}
      style={(estadoPressao) => [
        styles.button,
        {
          backgroundColor: corFundo,
          opacity: disabled ? 0.45 : estadoPressao.pressed ? 0.8 : 1,
        },
        typeof style === "function" ? style(estadoPressao) : style,
      ]}
      {...props}
    >
      {carregando ? (
        <ActivityIndicator color={cor} />
      ) : (
        <Text style={[styles.label, { color: cor }]}>{rotulo}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
});
