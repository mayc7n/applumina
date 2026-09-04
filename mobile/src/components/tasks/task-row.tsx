import { format, parseISO } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
} from "lucide-react-native";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useIdioma } from "@/i18n/idioma";
import { useTemaApp } from "@/theme/theme";
import type { Task } from "@/types/api";

interface TaskRowProps {
  tarefa: Task;
  aoAlternar: () => void;
  aoEditar: () => void;
  desabilitada?: boolean;
}

export function TaskRow({
  tarefa,
  aoAlternar,
  aoEditar,
  desabilitada = false,
}: TaskRowProps) {
  const tema = useTemaApp();
  const { idioma, traduzir } = useIdioma();
  const concluida = tarefa.status === "DONE";
  const prioridade = {
    LOW: { cor: tema.cores.prioridadeBaixa, texto: traduzir("tarefas.prioridadeBaixa") },
    MEDIUM: { cor: tema.cores.prioridadeMedia, texto: traduzir("tarefas.prioridadeMedia") },
    HIGH: { cor: tema.cores.prioridadeAlta, texto: traduzir("tarefas.prioridadeAlta") },
    URGENT: { cor: tema.cores.prioridadeUrgente, texto: traduzir("tarefas.prioridadeUrgente") },
  }[tarefa.priority];

  return (
    <View style={[styles.linha, { borderBottomColor: tema.cores.borda, opacity: desabilitada ? 0.58 : 1 }]}>
      <Pressable
        accessibilityLabel={traduzir(concluida ? "tarefas.reabrir" : "tarefas.concluir", { titulo: tarefa.title })}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: concluida, disabled: desabilitada }}
        disabled={desabilitada}
        hitSlop={4}
        onPress={aoAlternar}
        style={({ pressed }) => [styles.checkbox, { backgroundColor: pressed ? tema.cores.sobreposicao : "transparent" }]}
      >
        {desabilitada ? (
          <ActivityIndicator color={tema.cores.marca} size="small" />
        ) : concluida ? (
          <CheckCircle2 color={tema.cores.sucesso} size={23} />
        ) : (
          <Circle color={tema.cores.textoSutil} size={23} />
        )}
      </Pressable>
      <Pressable
        accessibilityLabel={traduzir("tarefas.editarAcessibilidade", { titulo: tarefa.title })}
        accessibilityRole="button"
        onPress={aoEditar}
        style={({ pressed }) => [styles.conteudoPressionavel, { backgroundColor: pressed ? tema.cores.sobreposicao : "transparent" }]}
      >
        <View style={styles.conteudo}>
          <Text
            numberOfLines={2}
            style={[styles.titulo, { color: concluida ? tema.cores.textoSecundario : tema.cores.texto, textDecorationLine: concluida ? "line-through" : "none" }]}
          >
            {tarefa.title}
          </Text>
          <View style={styles.detalhes}>
            {tarefa.dueDate ? (
              <View style={styles.detalhe}>
                <CalendarDays color={tema.cores.textoSutil} size={14} />
                <Text style={[styles.detalheTexto, { color: tema.cores.textoSutil }]}>
                  {format(parseISO(tarefa.dueDate), "PP", { locale: idioma === "en" ? enUS : ptBR })}
                  {tarefa.dueTime ? ` · ${tarefa.dueTime.slice(0, 5)}` : ""}
                </Text>
              </View>
            ) : null}
            {prioridade && !concluida ? (
              <View style={styles.detalhe}>
                <View style={[styles.prioridade, { backgroundColor: prioridade.cor }]} />
                <Text style={[styles.detalheTexto, { color: tema.cores.textoSecundario }]}>{prioridade.texto}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <ChevronRight color={tema.cores.textoSutil} size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    alignItems: "stretch",
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 68,
  },
  checkbox: { alignItems: "center", justifyContent: "center", width: 48 },
  conteudoPressionavel: { alignItems: "center", borderRadius: 10, flex: 1, flexDirection: "row", gap: 8, minHeight: 60, paddingHorizontal: 6, paddingVertical: 10 },
  conteudo: { flex: 1, gap: 6 },
  titulo: { fontSize: 16, fontWeight: "600", lineHeight: 21 },
  detalhes: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 10 },
  detalhe: { alignItems: "center", flexDirection: "row", gap: 5 },
  detalheTexto: { fontSize: 12, lineHeight: 16 },
  prioridade: { borderRadius: 3, height: 7, width: 7 },
});
