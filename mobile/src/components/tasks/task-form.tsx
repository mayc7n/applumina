import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { FormField } from "@/components/ui/form-field";
import {
  useCriarEtiquetaTarefa,
  useCriarProjetoTarefa,
  useEtiquetasTarefa,
  useProjetosTarefa,
} from "@/features/tasks/hooks";
import {
  montarEntradaTarefa,
  validarFormularioTarefa,
  valoresIniciaisTarefa,
  type ErrosFormularioTarefa,
  type ValoresFormularioTarefa,
} from "@/features/tasks/task-form";
import { useIdioma } from "@/i18n/idioma";
import { obterMensagemErroApi } from "@/lib/api/errors";
import { useTemaApp } from "@/theme/theme";
import type { CreateTaskInput, Task } from "@/types/api";

interface TaskFormProps {
  tarefa?: Task;
  salvando: boolean;
  aoSalvar: (entrada: CreateTaskInput) => Promise<void>;
  aoExcluir?: () => void;
  aoDuplicar?: () => void;
}

interface OpcaoProps {
  selecionada: boolean;
  rotulo: string;
  aoPressionar: () => void;
}

function Opcao({ selecionada, rotulo, aoPressionar }: OpcaoProps) {
  const tema = useTemaApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: selecionada }}
      onPress={aoPressionar}
      style={({ pressed }) => [
        styles.opcao,
        {
          backgroundColor: selecionada ? tema.cores.marcaSuave : tema.cores.elevado,
          borderColor: selecionada ? tema.cores.marcaContorno : tema.cores.borda,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <Text style={[styles.opcaoTexto, { color: selecionada ? tema.cores.marca : tema.cores.textoSecundario }]}>
        {rotulo}
      </Text>
    </Pressable>
  );
}

export function TaskForm({ tarefa, salvando, aoSalvar, aoExcluir, aoDuplicar }: TaskFormProps) {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const [valores, definirValores] = useState<ValoresFormularioTarefa>(() => valoresIniciaisTarefa(tarefa));
  const [erros, definirErros] = useState<ErrosFormularioTarefa>({});
  const [erroAcao, definirErroAcao] = useState("");
  const [novoProjeto, definirNovoProjeto] = useState("");
  const [novaEtiqueta, definirNovaEtiqueta] = useState("");
  const projetos = useProjetosTarefa();
  const etiquetas = useEtiquetasTarefa();
  const criarProjeto = useCriarProjetoTarefa();
  const criarEtiqueta = useCriarEtiquetaTarefa();

  function atualizar<K extends keyof ValoresFormularioTarefa>(campo: K, valor: ValoresFormularioTarefa[K]): void {
    definirValores((atuais) => ({ ...atuais, [campo]: valor }));
    definirErros((atuais) => ({ ...atuais, [campo]: undefined, reminder: undefined }));
  }

  async function salvar(): Promise<void> {
    const novosErros = validarFormularioTarefa(valores, {
      title: traduzir("tarefas.validacaoTitulo"),
      dueDate: traduzir("tarefas.validacaoData"),
      dueTime: traduzir("tarefas.validacaoHorario"),
      scheduledFor: traduzir("tarefas.validacaoData"),
      estimatedMins: traduzir("tarefas.validacaoDuracao"),
      reminder: traduzir("tarefas.validacaoLembrete"),
    });
    definirErros(novosErros);
    if (Object.keys(novosErros).length) return;
    definirErroAcao("");
    try {
      await aoSalvar(montarEntradaTarefa(valores, Boolean(tarefa)));
    } catch (erro) {
      definirErroAcao(obterMensagemErroApi(erro, traduzir("tarefas.erroSalvar"), false));
    }
  }

  async function adicionarProjeto(): Promise<void> {
    const nome = novoProjeto.trim();
    if (!nome || criarProjeto.isPending) return;
    definirErroAcao("");
    try {
      const projeto = await criarProjeto.mutateAsync(nome);
      atualizar("projectId", projeto.id);
      definirNovoProjeto("");
    } catch (erro) {
      definirErroAcao(obterMensagemErroApi(erro, traduzir("tarefas.erroProjeto"), false));
    }
  }

  async function adicionarEtiqueta(): Promise<void> {
    const nome = novaEtiqueta.trim();
    if (!nome || criarEtiqueta.isPending) return;
    definirErroAcao("");
    try {
      const etiqueta = await criarEtiqueta.mutateAsync(nome);
      atualizar("labelIds", [...valores.labelIds, etiqueta.id]);
      definirNovaEtiqueta("");
    } catch (erro) {
      definirErroAcao(obterMensagemErroApi(erro, traduzir("tarefas.erroEtiqueta"), false));
    }
  }

  const prioridades = [
    ["NONE", "tarefas.prioridadeNenhuma"],
    ["LOW", "tarefas.prioridadeBaixa"],
    ["MEDIUM", "tarefas.prioridadeMedia"],
    ["HIGH", "tarefas.prioridadeAlta"],
    ["URGENT", "tarefas.prioridadeUrgente"],
  ] as const;
  const recorrencias = [
    ["NONE", "tarefas.recorrenciaNenhuma"],
    ["DAILY", "tarefas.recorrenciaDiaria"],
    ["WEEKLY", "tarefas.recorrenciaSemanal"],
    ["MONTHLY", "tarefas.recorrenciaMensal"],
    ["YEARLY", "tarefas.recorrenciaAnual"],
  ] as const;

  return (
    <View style={styles.formulario}>
      <FormField
        autoCapitalize="sentences"
        autoFocus={!tarefa}
        erro={erros.title}
        maxLength={500}
        onChangeText={(texto) => atualizar("title", texto)}
        placeholder={traduzir("tarefas.tituloPlaceholder")}
        returnKeyType="next"
        rotulo={traduzir("tarefas.campoTitulo")}
        value={valores.title}
      />
      <FormField
        erro={undefined}
        maxLength={10_000}
        multiline
        onChangeText={(texto) => atualizar("description", texto)}
        placeholder={traduzir("tarefas.descricaoPlaceholder")}
        rotulo={traduzir("tarefas.descricao")}
        style={styles.textarea}
        textAlignVertical="top"
        value={valores.description}
      />

      <View style={styles.grupo}>
        <Text style={[styles.rotulo, { color: tema.cores.texto }]}>{traduzir("tarefas.prioridade")}</Text>
        <View style={styles.opcoes}>
          {prioridades.map(([valor, chave]) => (
            <Opcao key={valor} selecionada={valores.priority === valor} rotulo={traduzir(chave)} aoPressionar={() => atualizar("priority", valor)} />
          ))}
        </View>
      </View>

      <View style={styles.duasColunas}>
        <FormField
          autoCapitalize="none"
          erro={erros.dueDate}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          onChangeText={(texto) => atualizar("dueDate", texto)}
          placeholder={traduzir("tarefas.dataPlaceholder")}
          rotulo={traduzir("tarefas.dataLimite")}
          value={valores.dueDate}
        />
        <FormField
          autoCapitalize="none"
          erro={erros.dueTime}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          onChangeText={(texto) => atualizar("dueTime", texto)}
          placeholder="19:00"
          rotulo={traduzir("tarefas.horario")}
          value={valores.dueTime}
        />
      </View>
      <FormField
        autoCapitalize="none"
        erro={erros.scheduledFor}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        onChangeText={(texto) => atualizar("scheduledFor", texto)}
        placeholder={traduzir("tarefas.dataPlaceholder")}
        rotulo={traduzir("tarefas.agendadaPara")}
        value={valores.scheduledFor}
      />
      <FormField
        erro={erros.estimatedMins}
        keyboardType="number-pad"
        maxLength={5}
        onChangeText={(texto) => atualizar("estimatedMins", texto.replace(/\D/g, ""))}
        placeholder="30"
        rotulo={traduzir("tarefas.duracaoEstimada")}
        value={valores.estimatedMins}
      />

      <View style={styles.grupo}>
        <Text style={[styles.rotulo, { color: tema.cores.texto }]}>{traduzir("tarefas.recorrencia")}</Text>
        <View style={styles.opcoes}>
          {recorrencias.map(([valor, chave]) => (
            <Opcao key={valor} selecionada={valores.recurrenceType === valor} rotulo={traduzir(chave)} aoPressionar={() => atualizar("recurrenceType", valor)} />
          ))}
        </View>
      </View>

      <View style={styles.grupo}>
        <Text style={[styles.rotulo, { color: tema.cores.texto }]}>{traduzir("tarefas.projeto")}</Text>
        {projetos.isLoading ? <ActivityIndicator accessibilityLabel={traduzir("comum.preparando")} color={tema.cores.marca} /> : null}
        {projetos.isError ? (
          <View style={styles.erroOrganizacao}>
            <Text accessibilityLiveRegion="polite" style={[styles.erro, { color: tema.cores.perigo }]}>{traduzir("tarefas.projetosErro")}</Text>
            <AppButton onPress={() => void projetos.refetch()} rotulo={traduzir("comum.tentarNovamente")} variante="secondary" />
          </View>
        ) : null}
        <View style={styles.opcoes}>
          <Opcao selecionada={!valores.projectId} rotulo={traduzir("tarefas.caixaEntrada")} aoPressionar={() => atualizar("projectId", "")} />
          {(projetos.data ?? []).map((projeto) => (
            <Opcao key={projeto.id} selecionada={valores.projectId === projeto.id} rotulo={projeto.name} aoPressionar={() => atualizar("projectId", projeto.id)} />
          ))}
        </View>
        <View style={styles.adicionarLinha}>
          <FormField
            accessibilityLabel={traduzir("tarefas.novoProjeto")}
            containerStyle={styles.adicionarCampo}
            maxLength={100}
            onChangeText={definirNovoProjeto}
            onSubmitEditing={() => void adicionarProjeto()}
            placeholder={traduzir("tarefas.novoProjeto")}
            rotulo={traduzir("tarefas.novoProjeto")}
            style={styles.adicionarEntrada}
            value={novoProjeto}
          />
          <AppButton
            accessibilityLabel={traduzir("tarefas.adicionarProjeto")}
            carregando={criarProjeto.isPending}
            disabled={!novoProjeto.trim()}
            onPress={() => void adicionarProjeto()}
            rotulo="+"
            style={styles.adicionarBotao}
            variante="secondary"
          />
        </View>
      </View>

      <View style={styles.grupo}>
        <Text style={[styles.rotulo, { color: tema.cores.texto }]}>{traduzir("tarefas.etiquetas")}</Text>
        {etiquetas.isLoading ? <ActivityIndicator accessibilityLabel={traduzir("comum.preparando")} color={tema.cores.marca} /> : null}
        {etiquetas.isError ? (
          <View style={styles.erroOrganizacao}>
            <Text accessibilityLiveRegion="polite" style={[styles.erro, { color: tema.cores.perigo }]}>{traduzir("tarefas.etiquetasErro")}</Text>
            <AppButton onPress={() => void etiquetas.refetch()} rotulo={traduzir("comum.tentarNovamente")} variante="secondary" />
          </View>
        ) : null}
        <View style={styles.opcoes}>
          {(etiquetas.data ?? []).map((etiqueta) => (
            <Opcao
              key={etiqueta.id}
              selecionada={valores.labelIds.includes(etiqueta.id)}
              rotulo={etiqueta.name}
              aoPressionar={() => atualizar(
                "labelIds",
                valores.labelIds.includes(etiqueta.id)
                  ? valores.labelIds.filter((id) => id !== etiqueta.id)
                  : [...valores.labelIds, etiqueta.id],
              )}
            />
          ))}
        </View>
        <View style={styles.adicionarLinha}>
          <FormField
            accessibilityLabel={traduzir("tarefas.novaEtiqueta")}
            containerStyle={styles.adicionarCampo}
            maxLength={50}
            onChangeText={definirNovaEtiqueta}
            onSubmitEditing={() => void adicionarEtiqueta()}
            placeholder={traduzir("tarefas.novaEtiqueta")}
            rotulo={traduzir("tarefas.novaEtiqueta")}
            style={styles.adicionarEntrada}
            value={novaEtiqueta}
          />
          <AppButton
            accessibilityLabel={traduzir("tarefas.adicionarEtiqueta")}
            carregando={criarEtiqueta.isPending}
            disabled={!novaEtiqueta.trim()}
            onPress={() => void adicionarEtiqueta()}
            rotulo="+"
            style={styles.adicionarBotao}
            variante="secondary"
          />
        </View>
      </View>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: valores.remindAtDueTime }}
        onPress={() => atualizar("remindAtDueTime", !valores.remindAtDueTime)}
        style={({ pressed }) => [styles.interruptorLinha, { borderColor: erros.reminder ? tema.cores.perigo : tema.cores.borda, opacity: pressed ? 0.7 : 1 }]}
      >
        <View style={[styles.interruptor, { backgroundColor: valores.remindAtDueTime ? tema.cores.marca : tema.cores.bordaForte }]}>
          <View style={[styles.interruptorPonto, { backgroundColor: valores.remindAtDueTime ? tema.cores.sobreMarca : tema.cores.elevado, transform: [{ translateX: valores.remindAtDueTime ? 18 : 0 }] }]} />
        </View>
        <View style={styles.interruptorTexto}>
          <Text style={[styles.rotulo, { color: tema.cores.texto }]}>{traduzir("tarefas.lembrete")}</Text>
          <Text style={[styles.ajuda, { color: tema.cores.textoSecundario }]}>{traduzir("tarefas.lembreteAjuda")}</Text>
        </View>
      </Pressable>
      {erros.reminder ? <Text accessibilityLiveRegion="polite" style={[styles.erro, { color: tema.cores.perigo }]}>{erros.reminder}</Text> : null}
      {erroAcao ? <Text accessibilityLiveRegion="assertive" style={[styles.erro, { color: tema.cores.perigo }]}>{erroAcao}</Text> : null}

      <AppButton carregando={salvando} onPress={() => void salvar()} rotulo={traduzir(tarefa ? "tarefas.salvarAlteracoes" : "tarefas.criarTarefa")} />
      {tarefa && aoDuplicar ? <AppButton disabled={salvando} onPress={aoDuplicar} rotulo={traduzir("tarefas.duplicar")} variante="secondary" /> : null}
      {tarefa && aoExcluir ? <AppButton disabled={salvando} onPress={aoExcluir} rotulo={traduzir("tarefas.excluir")} variante="danger" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: 22 },
  grupo: { gap: 10 },
  rotulo: { fontSize: 14, fontWeight: "700" },
  opcoes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  opcao: { borderRadius: 999, borderWidth: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: 14 },
  opcaoTexto: { fontSize: 14, fontWeight: "600" },
  textarea: { minHeight: 96, paddingTop: 12 },
  duasColunas: { gap: 14 },
  adicionarLinha: { alignItems: "flex-end", flexDirection: "row", gap: 8 },
  adicionarCampo: { flex: 1 },
  adicionarEntrada: { minWidth: 0 },
  adicionarBotao: { minWidth: 52 },
  interruptorLinha: { alignItems: "center", borderBottomWidth: 1, borderTopWidth: 1, flexDirection: "row", gap: 14, minHeight: 68, paddingVertical: 10 },
  interruptor: { borderRadius: 14, height: 28, justifyContent: "center", padding: 3, width: 50 },
  interruptorPonto: { borderRadius: 11, height: 22, width: 22 },
  interruptorTexto: { flex: 1, gap: 3 },
  ajuda: { fontSize: 13, lineHeight: 18 },
  erro: { fontSize: 13, lineHeight: 19 },
  erroOrganizacao: { gap: 10 },
});
