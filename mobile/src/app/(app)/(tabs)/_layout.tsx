import { Tabs } from "expo-router";
import {
  CheckSquare2,
  Dumbbell,
  Home,
  UserRound,
  UsersRound,
} from "lucide-react-native";

import { useIdioma } from "@/i18n/idioma";
import { useTemaApp } from "@/theme/theme";

export default function LayoutAbas() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tema.cores.marca,
        tabBarInactiveTintColor: tema.cores.textoSutil,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: tema.cores.elevado,
          borderColor: tema.cores.borda,
          borderRadius: 24,
          borderTopWidth: 1,
          borderWidth: 1,
          elevation: 10,
          height: 72,
          marginBottom: 10,
          marginHorizontal: 12,
          paddingBottom: 6,
          paddingTop: 6,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: tema.escuro ? 0.3 : 0.09,
          shadowRadius: 18,
        },
        tabBarActiveBackgroundColor: tema.cores.marcaSuave,
        tabBarItemStyle: {
          borderRadius: 17,
          marginHorizontal: 2,
          marginVertical: 3,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
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
      <Tabs.Screen
        name="account"
        options={{
          title: traduzir("navegacao.conta"),
          tabBarIcon: ({ color: cor, size: tamanho }) => (
            <UserRound color={cor} size={tamanho} />
          ),
        }}
      />
    </Tabs>
  );
}
