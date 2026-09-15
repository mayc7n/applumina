import { Tabs } from "expo-router";
import {
  CheckSquare2,
  Dumbbell,
  Home,
  UsersRound,
  UserRound,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, useWindowDimensions, View } from "react-native";

import { useIdioma } from "@/i18n/idioma";
import { useTemaApp } from "@/theme/theme";
import { criarMovimento } from "@/theme/motion";
import { useReducaoMovimento } from "@/theme/use-reduced-motion";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function IconeAba({ ativo, Icone, tamanho }: { ativo: boolean; Icone: LucideIcon; tamanho: number }) {
  const tema = useTemaApp();
  const reduzirMovimento = useReducaoMovimento();
  const movimento = criarMovimento(reduzirMovimento !== false).selecao;
  const [progresso] = useState(() => new Animated.Value(ativo ? 1 : 0));

  useEffect(() => {
    const transicao = Animated.timing(progresso, {
      duration: movimento.duracao,
      toValue: ativo ? 1 : 0,
      useNativeDriver: true,
    });
    transicao.start();
    return () => transicao.stop();
  }, [ativo, movimento.duracao, progresso]);

  return (
    <View style={styles.iconeAba}>
      <Animated.View
        style={[
          styles.indicadorAba,
          {
            backgroundColor: tema.cores.marcaSuave,
            borderColor: tema.cores.marcaContorno,
            opacity: progresso,
            transform: [
              {
                scale: progresso.interpolate({
                  inputRange: [0, 1],
                  outputRange: [movimento.escalaInativa, 1],
                }),
              },
            ],
          },
        ]}
      />
      <Icone
        color={ativo ? tema.cores.marca : tema.cores.textoSutil}
        size={tamanho}
        strokeWidth={ativo ? 2.5 : 2}
      />
    </View>
  );
}

function FundoBarra() {
  const tema = useTemaApp();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.barra3D,
        {
          backgroundColor: tema.cores.elevado,
          borderColor: tema.cores.borda,
        },
      ]}
    />
  );
}

export default function LayoutAbas() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const reduzirMovimento = useReducaoMovimento();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const alturaBarra = 62 + Math.max(0, Math.ceil((fontScale - 1) * 16));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: reduzirMovimento === false ? "shift" : "none",
        tabBarAllowFontScaling: true,
        tabBarVisibilityAnimationConfig:
          reduzirMovimento === false
            ? undefined
            : {
                hide: { animation: "timing", config: { duration: 0 } },
                show: { animation: "timing", config: { duration: 0 } },
              },
        tabBarActiveTintColor: tema.cores.marca,
        tabBarInactiveTintColor: tema.cores.textoSutil,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => <FundoBarra />,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderRadius: 20,
          borderTopWidth: 0,
          elevation: 1,
          height: alturaBarra + insets.bottom,
          marginBottom: 6,
          marginHorizontal: 12,
          paddingBottom: 4 + insets.bottom,
          paddingTop: 4,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 2,
          marginVertical: 2,
          overflow: "visible",
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          overflow: "visible",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: traduzir("navegacao.inicio"),
          tabBarIcon: ({ focused: ativo, size: tamanho }) => (
            <IconeAba ativo={ativo} Icone={Home} tamanho={tamanho} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: traduzir("navegacao.tarefas"),
          tabBarIcon: ({ focused: ativo, size: tamanho }) => (
            <IconeAba ativo={ativo} Icone={CheckSquare2} tamanho={tamanho} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: traduzir("navegacao.treinos"),
          tabBarIcon: ({ focused: ativo, size: tamanho }) => (
            <IconeAba ativo={ativo} Icone={Dumbbell} tamanho={tamanho} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: traduzir("navegacao.amigos"),
          tabBarIcon: ({ focused: ativo, size: tamanho }) => (
            <IconeAba ativo={ativo} Icone={UsersRound} tamanho={tamanho} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: traduzir("navegacao.perfil"),
          tabBarIcon: ({ focused: ativo, size: tamanho }) => (
            <IconeAba ativo={ativo} Icone={UserRound} tamanho={tamanho} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconeAba: { alignItems: "center", height: 30, justifyContent: "center", width: 48 },
  indicadorAba: {
    borderRadius: 14,
    borderWidth: 1,
    bottom: 1,
    left: 2,
    position: "absolute",
    right: 2,
    top: 1,
  },
  barra3D: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0,
  },
});
