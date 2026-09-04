import { Redirect, Stack } from "expo-router";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";

export default function LayoutProtegido() {
  const estado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado,
  );

  if (estado === "inicializando") return <LoadingScreen />;
  if (estado !== "autenticado") return <Redirect href="/login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
