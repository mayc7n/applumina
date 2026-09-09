import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";

import { useTemaApp } from "@/theme/theme";
import { criarMovimento, formaInterface } from "@/theme/motion";
import { useReducaoMovimento } from "@/theme/use-reduced-motion";

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
  onPressIn,
  onPressOut,
  style,
  ...props
}: AppButtonProps) {
  const tema = useTemaApp();
  const reduzirMovimento = useReducaoMovimento();
  const movimentoReduzido = reduzirMovimento !== false;
  const [escala] = useState(() => new Animated.Value(1));
  const movimento = criarMovimento(movimentoReduzido).pressao;
  const corFundo =
    variante === "primary"
      ? tema.cores.marca
      : variante === "danger"
        ? tema.cores.perigo
        : tema.cores.sobreposicao;
  const cor =
    variante === "secondary" ? tema.cores.texto : tema.cores.sobreMarca;

  useEffect(() => {
    if (movimentoReduzido) {
      escala.stopAnimation();
      escala.setValue(1);
    }
  }, [escala, movimentoReduzido]);

  function animarPressao(
    pressionado: boolean,
    evento: GestureResponderEvent,
    callback?: ((evento: GestureResponderEvent) => void) | null,
  ) {
    callback?.(evento);

    if (movimentoReduzido) {
      escala.setValue(1);
      return;
    }

    Animated.timing(escala, {
      duration: movimento.duracao,
      toValue: pressionado ? movimento.escala : 1,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: Boolean(disabled || carregando),
        busy: carregando,
      }}
      disabled={disabled || carregando}
      onPressIn={(evento) => animarPressao(true, evento, onPressIn)}
      onPressOut={(evento) => animarPressao(false, evento, onPressOut)}
      style={(estadoPressao) => [
        styles.button,
        {
          backgroundColor:
            estadoPressao.pressed && variante === "primary"
              ? tema.cores.marcaPressionada
              : estadoPressao.pressed && variante === "secondary"
                ? tema.cores.borda
                : corFundo,
          borderColor:
            variante === "secondary" ? tema.cores.bordaForte : corFundo,
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: escala }],
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
    borderRadius: formaInterface.raioBotao,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
});
