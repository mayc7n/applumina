import { router } from "expo-router";
import { Languages, ShieldCheck, type LucideIcon } from "lucide-react-native";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useIdioma } from "@/i18n/idioma";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";

export default function TelaConta() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const usuario = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.usuario,
  );
  const sair = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.sair,
  );
  const autenticado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado === "autenticado",
  );

  if (!autenticado) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.tela, { backgroundColor: tema.cores.fundo }]}
      >
        <ScrollView contentContainerStyle={styles.conteudo}>
          <ScreenHeader titulo={traduzir("conta.titulo")} />
          <View
            style={[
              styles.visitante,
              {
                backgroundColor: tema.cores.marcaSuave,
                borderColor: tema.cores.marcaContorno,
              },
            ]}
          >
            <Text style={[styles.nome, { color: tema.cores.texto }]}>
              {traduzir("conta.visitanteTitulo")}
            </Text>
            <Text
              style={[styles.descricaoCartao, { color: tema.cores.textoSecundario }]}
            >
              {traduzir("conta.visitanteDescricao")}
            </Text>
          </View>
          <AppButton
            onPress={() => router.push("/login")}
            rotulo={traduzir("comum.entrar")}
          />
          <AppButton
            onPress={() => router.push("/register")}
            rotulo={traduzir("comum.criarConta")}
            variante="secondary"
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  function confirmarSaida(): void {
    Alert.alert(
      traduzir("conta.confirmarTitulo"),
      traduzir("conta.confirmarDescricao"),
      [
        { text: traduzir("conta.cancelar"), style: "cancel" },
        {
          text: traduzir("conta.confirmar"),
          style: "destructive",
          onPress: () => {
            void sair().finally(() => router.replace("/login"));
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView
      style={[styles.tela, { backgroundColor: tema.cores.fundo }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView contentContainerStyle={styles.conteudo}>
        <ScreenHeader titulo={traduzir("conta.titulo")} />
        <View
          style={[
            styles.perfil,
            {
              backgroundColor: tema.cores.elevado,
              borderColor: tema.cores.borda,
            },
          ]}
        >
          <View
            style={[styles.avatar, { backgroundColor: tema.cores.marcaSuave }]}
          >
            <Text style={[styles.inicial, { color: tema.cores.marca }]}>
              {usuario?.displayName?.trim().charAt(0).toUpperCase() ?? "L"}
            </Text>
          </View>
          <View style={styles.dadosPerfil}>
            <Text style={[styles.nome, { color: tema.cores.texto }]}>
              {usuario?.displayName}
            </Text>
            <Text style={[styles.email, { color: tema.cores.textoSecundario }]}>
              {usuario?.email}
            </Text>
            <Text style={[styles.plano, { color: tema.cores.marca }]}>
              {traduzir("conta.plano", { plano: usuario?.plan ?? "FREE" })}
            </Text>
          </View>
        </View>

        <CartaoInformativo
          Icone={ShieldCheck}
          titulo={traduzir("conta.sessaoTitulo")}
          descricao={traduzir("conta.sessaoDescricao")}
        />
        <CartaoInformativo
          Icone={Languages}
          titulo={traduzir("conta.idiomaTitulo")}
          descricao={traduzir("conta.idiomaSistema")}
        />
        <AppButton
          rotulo={traduzir("conta.sair")}
          variante="secondary"
          onPress={confirmarSaida}
          accessibilityHint={traduzir("conta.confirmarDescricao")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function CartaoInformativo({
  Icone,
  titulo,
  descricao,
}: {
  Icone: LucideIcon;
  titulo: string;
  descricao: string;
}) {
  const tema = useTemaApp();
  return (
    <View
      style={[
        styles.cartao,
        { backgroundColor: tema.cores.elevado, borderColor: tema.cores.borda },
      ]}
    >
      <View style={[styles.icone, { backgroundColor: tema.cores.marcaSuave }]}>
        <Icone color={tema.cores.marca} size={21} />
      </View>
      <View style={styles.textoCartao}>
        <Text style={[styles.tituloCartao, { color: tema.cores.texto }]}>
          {titulo}
        </Text>
        <Text
          style={[
            styles.descricaoCartao,
            { color: tema.cores.textoSecundario },
          ]}
        >
          {descricao}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: {
    gap: 14,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  perfil: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 8,
    padding: 18,
  },
  visitante: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  inicial: { fontSize: 23, fontWeight: "800" },
  dadosPerfil: { flex: 1, gap: 3 },
  nome: { fontSize: 17, fontWeight: "700" },
  email: { fontSize: 13 },
  plano: { fontSize: 11, fontWeight: "800", marginTop: 3 },
  cartao: {
    alignItems: "flex-start",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 13,
    padding: 16,
  },
  icone: {
    alignItems: "center",
    borderRadius: 11,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  textoCartao: { flex: 1, gap: 4 },
  tituloCartao: { fontSize: 15, fontWeight: "700" },
  descricaoCartao: { fontSize: 13, lineHeight: 19 },
});
