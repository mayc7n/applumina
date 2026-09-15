import { Tabs } from "expo-router";
import {
  CheckSquare2,
  Dumbbell,
  Home,
  UsersRound,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useIdioma } from "@/i18n/idioma";
import { useTemaApp } from "@/theme/theme";

export default function LayoutAbas() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tema.cores.marca,
        tabBarInactiveTintColor: tema.cores.textoSutil,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: tema.cores.elevado,
          borderTopColor: tema.cores.borda,
          borderTopWidth: 1,
          elevation: 0,
          height: 52 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: traduzir("navegacao.inicio"),
          tabBarIcon: ({ color: cor, size: tamanho }) => (
            <Home color={cor} size={tamanho} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: traduzir("navegacao.tarefas"),
          tabBarIcon: ({ color: cor, size: tamanho }) => (
            <CheckSquare2 color={cor} size={tamanho} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: traduzir("navegacao.treinos"),
          tabBarIcon: ({ color: cor, size: tamanho }) => (
            <Dumbbell color={cor} size={tamanho} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: traduzir("navegacao.amigos"),
          tabBarIcon: ({ color: cor, size: tamanho }) => (
            <UsersRound color={cor} size={tamanho} />
          ),
        }}
      />
    </Tabs>
  );
}
