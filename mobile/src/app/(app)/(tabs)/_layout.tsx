import { Tabs } from "expo-router";
import { CheckSquare2, Home, UserRound } from "lucide-react-native";

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
          borderTopColor: tema.cores.borda,
          height: 64,
          paddingBottom: 7,
          paddingTop: 6,
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
