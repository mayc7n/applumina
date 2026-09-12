import type { ReactNode } from "react";
import { type StyleProp, type ViewStyle, View } from "react-native";

interface GrupoSelecaoProps {
  children: ReactNode;
  rotulo: string;
  style?: StyleProp<ViewStyle>;
}

export function GrupoSelecao({ children, rotulo, style }: GrupoSelecaoProps) {
  return (
    <View accessibilityLabel={rotulo} accessibilityRole="radiogroup" style={style}>
      {children}
    </View>
  );
}
