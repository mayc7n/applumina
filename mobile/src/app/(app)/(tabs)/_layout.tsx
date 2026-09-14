import { Tabs } from "expo-router";
import {
  CheckSquare2,
  Dumbbell,
  Home,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { useIdioma } from "@/i18n/idioma";
import { useTemaApp } from "@/theme/theme";
import { criarMovimento } from "@/theme/motion";
import { useReducaoMovimento } from "@/theme/use-reduced-motion";

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

function FundoBarra3D() {
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
    >
      <View
        style={[
          styles.luzBarra,
          { backgroundColor: tema.escuro ? tema.cores.texto : tema.cores.sobreMarca },
        ]}
      />
      <View style={[styles.baseBarra, { backgroundColor: tema.cores.borda }]} />
    </View>
  );
}

export default function LayoutAbas() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const reduzirMovimento = useReducaoMovimento();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: reduzirMovimento === false ? "shift" : "none",
        tabBarActiveTintColor: tema.cores.marca,
        tabBarInactiveTintColor: tema.cores.textoSutil,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => <FundoBarra3D />,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderRadius: 26,
          borderTopWidth: 0,
          elevation: 16,
          height: 74,
          marginBottom: 10,
          marginHorizontal: 12,
          paddingBottom: 6,
          paddingTop: 6,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: tema.escuro ? 0.42 : 0.2,
          shadowRadius: 22,
        },
        tabBarItemStyle: {
          borderRadius: 19,
          marginHorizontal: 2,
          marginVertical: 4,
          overflow: "hidden",
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
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
        name="account"
        options={{
          title: traduzir("navegacao.conta"),
          tabBarIcon: ({ focused: ativo, size: tamanho }) => (
            <IconeAba ativo={ativo} Icone={UserRound} tamanho={tamanho} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconeAba: { alignItems: "center", height: 32, justifyContent: "center", width: 48 },
  indicadorAba: {
    borderRadius: 16,
    borderWidth: 1,
    bottom: 0,
    elevation: 3,
    left: 0,
    position: "absolute",
    right: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    top: 0,
  },
  barra3D: {
    borderRadius: 26,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0,
  },
  luzBarra: {
    height: 2,
    left: 22,
    opacity: 0.72,
    position: "absolute",
    right: 22,
    top: 1,
  },
  baseBarra: {
    bottom: 0,
    height: 9,
    left: 18,
    opacity: 0.28,
    position: "absolute",
    right: 18,
  },
});
