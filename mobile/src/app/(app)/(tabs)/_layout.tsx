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
            backgroundColor: tema.cores.marca,
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
        color={ativo ? tema.cores.sobreMarca : tema.cores.textoSutil}
        size={tamanho}
        strokeWidth={ativo ? 2.5 : 2}
      />
    </View>
  );
}

export default function LayoutAbas() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "shift",
        tabBarActiveTintColor: tema.cores.marca,
        tabBarInactiveTintColor: tema.cores.textoSutil,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: tema.cores.elevado,
          borderRadius: 24,
          borderTopWidth: 0,
          elevation: 14,
          height: 72,
          marginBottom: 10,
          marginHorizontal: 12,
          paddingBottom: 6,
          paddingTop: 6,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: tema.escuro ? 0.34 : 0.13,
          shadowRadius: 20,
        },
        tabBarItemStyle: {
          borderRadius: 17,
          marginHorizontal: 2,
          marginVertical: 3,
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
  indicadorAba: { borderRadius: 16, bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
});
