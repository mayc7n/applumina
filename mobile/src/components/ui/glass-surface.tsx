import { BlurView } from "expo-blur";
import type { PropsWithChildren } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { useTemaApp } from "@/theme/theme";

interface GlassSurfaceProps extends ViewProps {
  intensidade?: number;
}

export function GlassSurface({
  children,
  intensidade = 28,
  style,
  ...props
}: PropsWithChildren<GlassSurfaceProps>) {
  const tema = useTemaApp();

  return (
    <View
      {...props}
      style={[
        styles.superficie,
        {
          backgroundColor: tema.cores.vidro,
          borderColor: tema.cores.vidroBorda,
          shadowColor: tema.cores.vidroSombra,
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensidade}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        tint={tema.escuro ? "dark" : "light"}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.reflexo,
          { borderColor: tema.cores.vidroReflexo },
        ]}
      />
      <View style={styles.conteudo}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  superficie: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 3,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
  },
  reflexo: {
    borderRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  conteudo: { zIndex: 1 },
});
