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
  const [opacidade] = useState(() => new Animated.Value(0));
  const [deslocamentoY] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduzirMovimento === null) {
      return;
    }

    const movimento = criarMovimento(reduzirMovimento).entrada;

    if (reduzirMovimento) {
      opacidade.setValue(1);
      deslocamentoY.setValue(0);
      return;
    }

    opacidade.setValue(0);
    deslocamentoY.setValue(movimento.deslocamentoY);
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
  }, [deslocamentoY, opacidade, reduzirMovimento]);

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
