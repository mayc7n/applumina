import { CalendarDays, Heart } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { useIdioma } from "@/i18n/idioma";
import { useTemaApp } from "@/theme/theme";
import type { SocialFeedItem } from "@/types/api";

interface SocialFeedCardProps {
  item: SocialFeedItem;
  rotuloCurtidas: string;
  rotuloOnline: string;
  rotuloTipo: string;
}

export function SocialFeedCard({
  item,
  rotuloCurtidas,
  rotuloOnline,
  rotuloTipo,
}: SocialFeedCardProps) {
  const tema = useTemaApp();
  const { idioma } = useIdioma();
  const data = new Intl.DateTimeFormat(idioma, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(item.createdAt));
  const tituloAcessibilidade =
    item.title && item.title !== item.type ? `, ${item.title}` : "";
  const descricaoAcessibilidade = item.description
    ? `, ${item.description}`
    : "";
  const rotuloAcessibilidade = `${item.user.displayName}, @${item.user.username}${item.user.isOnline ? `, ${rotuloOnline}` : ""}, ${rotuloTipo}${tituloAcessibilidade}${descricaoAcessibilidade}, ${data}, ${rotuloCurtidas}`;
  const iniciais = item.user.displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("")
    .toLocaleUpperCase();

  return (
    <View
      accessible
      accessibilityLabel={rotuloAcessibilidade}
      accessibilityRole="text"
      style={[
        styles.card,
        { backgroundColor: tema.cores.elevado, borderColor: tema.cores.borda },
      ]}
    >
      <View
        style={styles.cabecalho}
      >
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: tema.cores.marcaSuave,
              borderColor: tema.cores.marcaContorno,
            },
          ]}
        >
          <Text style={[styles.avatarTexto, { color: tema.cores.marca }]}>
            {iniciais}
          </Text>
          {item.user.isOnline ? (
            <View
              accessibilityElementsHidden
              accessibilityLabel={rotuloOnline}
              importantForAccessibility="no"
              style={[
                styles.online,
                {
                  backgroundColor: tema.cores.sucesso,
                  borderColor: tema.cores.elevado,
                },
              ]}
            />
          ) : null}
        </View>
        <View style={styles.identidade}>
          <Text numberOfLines={1} style={[styles.nome, { color: tema.cores.texto }]}>
            {item.user.displayName}
          </Text>
          <Text numberOfLines={1} style={[styles.usuario, { color: tema.cores.textoSecundario }]}>
            @{item.user.username}
          </Text>
        </View>
        <Text style={[styles.emoji, { color: tema.cores.texto }]}>{item.emoji}</Text>
      </View>

      <View style={styles.conteudo}>
        <Text style={[styles.tipo, { color: tema.cores.marca }]}>{rotuloTipo}</Text>
        {item.title && item.title !== item.type ? (
          <Text
            numberOfLines={2}
            style={[styles.titulo, { color: tema.cores.texto }]}
          >
            {item.title}
          </Text>
        ) : null}
        {item.description ? (
          <Text style={[styles.descricao, { color: tema.cores.texto }]}>
            {item.description}
          </Text>
        ) : null}
      </View>

      <View style={styles.rodape}>
        <View style={styles.metadado}>
          <CalendarDays color={tema.cores.textoSutil} size={16} />
          <Text style={[styles.curtidas, { color: tema.cores.textoSecundario }]}>
            {data}
          </Text>
        </View>
        <View style={styles.metadado}>
          <Heart color={tema.cores.textoSutil} size={16} />
          <Text style={[styles.curtidas, { color: tema.cores.textoSecundario }]}>
            {rotuloCurtidas}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, gap: 16, padding: 16 },
  cabecalho: { alignItems: "center", flexDirection: "row", gap: 11 },
  avatar: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    position: "relative",
    width: 44,
  },
  avatarTexto: { fontSize: 14, fontWeight: "800" },
  online: { borderRadius: 5, borderWidth: 2, bottom: -1, height: 10, position: "absolute", right: -1, width: 10 },
  identidade: { flex: 1, gap: 2 },
  nome: { fontSize: 15, fontWeight: "800", lineHeight: 20 },
  usuario: { fontSize: 12, lineHeight: 16 },
  emoji: { fontSize: 24 },
  conteudo: { gap: 6 },
  tipo: { fontSize: 12, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  titulo: { fontSize: 17, fontWeight: "800", lineHeight: 22 },
  descricao: { fontSize: 16, lineHeight: 23 },
  rodape: { alignItems: "center", flexDirection: "row", gap: 6 },
  metadado: { alignItems: "center", flexDirection: "row", gap: 6 },
  curtidas: { fontSize: 12, lineHeight: 16 },
});
