import { format, parseISO } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import * as Haptics from "expo-haptics";
import { CalendarDays, CheckCircle2, Circle } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useIdioma } from "@/i18n/idioma";
import { useTemaApp } from "@/theme/theme";
import type { Task } from "@/types/api";

interface TaskRowProps {
  tarefa: Task;
  aoAlternar: () => void;
  desabilitada?: boolean;
}

const coresPrioridade: Record<string, string> = {
  URGENT: "#EF4444",
  HIGH: "#F97316",
  MEDIUM: "#EAB308",
  LOW: "#3B82F6",
};

export function TaskRow({
  tarefa,
  aoAlternar,
  desabilitada = false,
}: TaskRowProps) {
  const tema = useTemaApp();
  const { idioma, traduzir } = useIdioma();
  const concluida = tarefa.status === "DONE";
  const corPrioridade = coresPrioridade[tarefa.priority];

  function alternar(): void {
    void Haptics.selectionAsync();
    aoAlternar();
  }

  return (
    <Pressable
      accessibilityLabel={traduzir(
        concluida ? "tarefas.reabrir" : "tarefas.concluir",
        {
          titulo: tarefa.title,
        },
      )}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: concluida, disabled: desabilitada }}
      disabled={desabilitada}
      onPress={alternar}
      style={({ pressed: pressionado }) => [
        styles.linha,
        {
          backgroundColor: pressionado
            ? tema.cores.sobreposicao
            : tema.cores.elevado,
          borderColor: tema.cores.borda,
          opacity: desabilitada ? 0.55 : 1,
        },
      ]}
    >
      {concluida ? (
        <CheckCircle2 color={tema.cores.sucesso} size={21} />
      ) : (
        <Circle color={tema.cores.textoSutil} size={21} />
      )}
      {corPrioridade && !concluida ? (
        <View style={[styles.prioridade, { backgroundColor: corPrioridade }]} />
      ) : null}
      <View style={styles.conteudo}>
        <Text
          numberOfLines={2}
          style={[
            styles.titulo,
            {
              color: concluida ? tema.cores.textoSecundario : tema.cores.texto,
              textDecorationLine: concluida ? "line-through" : "none",
            },
          ]}
        >
          {tarefa.title}
        </Text>
        {tarefa.dueDate ? (
          <View style={styles.data}>
            <CalendarDays color={tema.cores.textoSutil} size={13} />
            <Text style={[styles.dataTexto, { color: tema.cores.textoSutil }]}>
              {format(parseISO(tarefa.dueDate), "PP", {
                locale: idioma === "en" ? enUS : ptBR,
              })}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 11,
    minHeight: 58,
    padding: 14,
  },
  prioridade: { borderRadius: 3, height: 6, width: 6 },
  conteudo: { flex: 1, gap: 5 },
  titulo: { fontSize: 15, fontWeight: "600", lineHeight: 20 },
  data: { alignItems: "center", flexDirection: "row", gap: 5 },
  dataTexto: { fontSize: 11 },
});
