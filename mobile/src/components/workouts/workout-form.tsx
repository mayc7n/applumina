import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { FormField } from "@/components/ui/form-field";
import {
  montarEntradaTreino,
  validarFormularioTreino,
  valoresIniciaisTreino,
  type ErrosFormularioTreino,
  type ValoresFormularioTreino,
} from "@/features/workouts/workout-form";
import { useIdioma } from "@/i18n/idioma";
import { obterMensagemErroApi } from "@/lib/api/errors";
import { useTemaApp } from "@/theme/theme";
import type { CreateWorkoutInput, WorkoutType } from "@/types/api";

interface WorkoutFormProps {
  salvando: boolean;
  aoSalvar: (entrada: CreateWorkoutInput) => Promise<void>;
}

export function WorkoutForm({ salvando, aoSalvar }: WorkoutFormProps) {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const [valores, definirValores] = useState(valoresIniciaisTreino);
  const [erros, definirErros] = useState<ErrosFormularioTreino>({});
  const [erroAcao, definirErroAcao] = useState("");

  function atualizar<K extends keyof ValoresFormularioTreino>(
    campo: K,
    valor: ValoresFormularioTreino[K],
  ): void {
    definirValores((atuais) => ({ ...atuais, [campo]: valor }));
    definirErros((atuais) => ({ ...atuais, [campo]: undefined }));
  }

  async function salvar(): Promise<void> {
    const novosErros = validarFormularioTreino(valores, {
      activityDate: traduzir("treinos.validacaoData"),
      durationMins: traduzir("treinos.validacaoDuracao"),
      customActivity: traduzir("treinos.validacaoPersonalizada"),
    });
    definirErros(novosErros);
    if (Object.keys(novosErros).length) return;
    definirErroAcao("");
    try {
      await aoSalvar(montarEntradaTreino(valores));
    } catch (erro) {
      definirErroAcao(
        obterMensagemErroApi(erro, traduzir("treinos.erroSalvar"), false),
      );
    }
  }

  const modalidades: { tipo: WorkoutType; rotulo: string }[] = [
    { tipo: "WALKING", rotulo: traduzir("treinos.caminhada") },
    { tipo: "RUNNING", rotulo: traduzir("treinos.corrida") },
    { tipo: "STRENGTH", rotulo: traduzir("treinos.forca") },
    { tipo: "CYCLING", rotulo: traduzir("treinos.ciclismo") },
    { tipo: "SWIMMING", rotulo: traduzir("treinos.natacao") },
    { tipo: "MARTIAL_ARTS", rotulo: traduzir("treinos.artesMarciais") },
    { tipo: "TEAM_SPORT", rotulo: traduzir("treinos.esporteColetivo") },
    { tipo: "YOGA", rotulo: traduzir("treinos.yoga") },
    { tipo: "MOBILITY", rotulo: traduzir("treinos.mobilidade") },
    { tipo: "PILATES", rotulo: traduzir("treinos.pilates") },
    { tipo: "CUSTOM", rotulo: traduzir("treinos.personalizada") },
  ];

  return (
    <View style={styles.formulario}>
      <View style={styles.grupo}>
        <Text style={[styles.rotulo, { color: tema.cores.texto }]}>
          {traduzir("treinos.modalidade")}
        </Text>
        <View style={styles.opcoes}>
          {modalidades.map(({ tipo, rotulo }) => {
            const selecionada = valores.type === tipo;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: selecionada }}
                key={tipo}
                onPress={() => atualizar("type", tipo)}
                style={({ pressed }) => [
                  styles.opcao,
                  {
                    backgroundColor: selecionada
                      ? tema.cores.marcaSuave
                      : tema.cores.elevado,
                    borderColor: selecionada
                      ? tema.cores.marcaContorno
                      : tema.cores.borda,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.opcaoTexto,
                    {
                      color: selecionada
                        ? tema.cores.marca
                        : tema.cores.textoSecundario,
                    },
                  ]}
                >
                  {rotulo}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {valores.type === "CUSTOM" ? (
        <FormField
          autoCapitalize="sentences"
          erro={erros.customActivity}
          maxLength={100}
          onChangeText={(texto) => atualizar("customActivity", texto)}
          placeholder={traduzir("treinos.nomePlaceholder")}
          rotulo={traduzir("treinos.nomePersonalizado")}
          value={valores.customActivity}
        />
      ) : null}

      <View style={styles.duasColunas}>
        <FormField
          autoCapitalize="none"
          containerStyle={styles.coluna}
          erro={erros.activityDate}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          onChangeText={(texto) => atualizar("activityDate", texto)}
          placeholder="AAAA-MM-DD"
          rotulo={traduzir("treinos.data")}
          value={valores.activityDate}
        />
        <FormField
          containerStyle={styles.coluna}
          erro={erros.durationMins}
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={(texto) =>
            atualizar("durationMins", texto.replace(/\D/g, ""))
          }
          placeholder="45"
          rotulo={traduzir("treinos.duracao")}
          value={valores.durationMins}
        />
      </View>

      <FormField
        maxLength={2_000}
        multiline
        onChangeText={(texto) => atualizar("notes", texto)}
        placeholder={traduzir("treinos.observacoesPlaceholder")}
        rotulo={traduzir("treinos.observacoes")}
        style={styles.textarea}
        textAlignVertical="top"
        value={valores.notes}
      />

      <View style={[styles.privacidade, { borderColor: tema.cores.borda }]}>
        <Text
          style={[
            styles.privacidadeTexto,
            { color: tema.cores.textoSecundario },
          ]}
        >
          {traduzir("treinos.privacidade")}
        </Text>
      </View>
      {erroAcao ? (
        <Text
          accessibilityLiveRegion="assertive"
          style={[styles.erro, { color: tema.cores.perigo }]}
        >
          {erroAcao}
        </Text>
      ) : null}
      <AppButton
        carregando={salvando}
        onPress={() => void salvar()}
        rotulo={traduzir("treinos.salvar")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: 24 },
  grupo: { gap: 10 },
  rotulo: { fontSize: 14, fontWeight: "700" },
  opcoes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  opcao: {
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
  },
  opcaoTexto: { fontSize: 14, fontWeight: "600" },
  duasColunas: { flexDirection: "row", gap: 12 },
  coluna: { flex: 1 },
  textarea: { minHeight: 100, paddingTop: 12 },
  privacidade: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    paddingVertical: 14,
  },
  privacidadeTexto: { fontSize: 13, lineHeight: 19 },
  erro: { fontSize: 13, lineHeight: 19 },
});
