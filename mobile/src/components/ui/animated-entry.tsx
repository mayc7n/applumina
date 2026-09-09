import { type ReactNode, useEffect, useState } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";

import { criarMovimento } from "@/theme/motion";
import { useReducaoMovimento } from "@/theme/use-reduced-motion";

interface AnimatedEntryProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedEntry({ children, style }: AnimatedEntryProps) {
  const reduzirMovimento = useReducaoMovimento();
  const [animarNaMontagem] = useState(() => reduzirMovimento === false);
  const movimentoInicial = criarMovimento(false).entrada;
  const [opacidade] = useState(
    () => new Animated.Value(animarNaMontagem ? 0 : 1),
  );
  const [deslocamentoY] = useState(
    () =>
      new Animated.Value(
        animarNaMontagem ? movimentoInicial.deslocamentoY : 0,
      ),
  );

  useEffect(() => {
    if (reduzirMovimento === null) {
      return;
    }

    const movimento = criarMovimento(reduzirMovimento).entrada;

    if (reduzirMovimento || !animarNaMontagem) {
      opacidade.setValue(1);
      deslocamentoY.setValue(0);
      return;
    }

    const entrada = Animated.parallel([
      Animated.timing(opacidade, {
        duration: movimento.duracao,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(deslocamentoY, {
        duration: movimento.duracao,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    entrada.start();
    return () => entrada.stop();
  }, [animarNaMontagem, deslocamentoY, opacidade, reduzirMovimento]);

  return (
    <Animated.View
      style={[
        style,
        { opacity: opacidade, transform: [{ translateY: deslocamentoY }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}
