import { Redirect, Stack } from "expo-router";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";

export default function LayoutAutenticacao() {
  const estado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado,
  );

  if (estado === "inicializando") return <LoadingScreen />;
  if (estado === "autenticado") return <Redirect href="/home" />;

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}
