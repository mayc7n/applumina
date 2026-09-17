import { describe, expect, jest, test } from "@jest/globals";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { View } from "react-native";

import type { SocialFeedItem } from "@/types/api";

jest.mock("@/theme/theme", () => ({
  useTemaApp: () => ({
    cores: {
      borda: "#ddd",
      elevado: "#fff",
      marca: "#c00",
      marcaContorno: "#f00",
      marcaSuave: "#fee",
      sobreposicao: "#eee",
      texto: "#111",
      textoSecundario: "#555",
      textoSutil: "#777",
    },
  }),
}));

jest.mock("@/i18n/idioma", () => ({
  useIdioma: () => ({ idioma: "pt-BR" }),
}));

jest.mock("lucide-react-native", () => ({
  CalendarDays: () => null,
  Heart: () => null,
}));

const mockImage = (props: Record<string, unknown>) => (
  <View testID="social-feed-media" {...props} />
);

jest.mock("expo-image", () => ({
  Image: mockImage,
}));

jest.mock("@/lib/auth/session", () => ({
  obterTokenAcesso: () => "token-de-teste",
}));

process.env.EXPO_PUBLIC_API_URL = "https://api.example.test/api";

const { SocialFeedCard } = jest.requireActual<
  typeof import("./social-feed-card")
>("./social-feed-card");

const item: SocialFeedItem = {
  id: "post-1",
  user: {
    id: "user-1",
    displayName: "Maya Campos",
    username: "maya",
    isOnline: true,
    streak: 0,
    friendshipStatus: "ACCEPTED",
  },
  type: "WORKOUT",
  title: "Força de terça",
  description: "Treino leve",
  emoji: "🏋️",
  likeCount: 3,
  liked: false,
  createdAt: "2030-06-10T12:00:00Z",
  mediaUrl: "/social/posts/post-1/media",
};

describe("card do feed social", () => {
  test("expõe autor, conteúdo e curtidas como informação sem ação falsa", async () => {
    let renderizacao: ReactTestRenderer | undefined;
    await act(async () => {
      renderizacao = create(
        <SocialFeedCard
          item={item}
          rotuloCurtidas="3 curtidas"
          rotuloOnline="Online agora"
          rotuloTipo="Treino"
        />,
      );
    });
    const arvore = renderizacao?.toJSON();
    const texto = JSON.stringify(arvore);

    expect(texto).toContain("Maya Campos");
    expect(texto).toContain("maya");
    expect(texto).toContain("Treino");
    expect(texto).toContain("Força de terça");
    expect(texto).toContain("Treino leve");
    expect(texto).toContain("10 de jun. de 2030");
    expect(texto).toContain("3 curtidas");
    expect(texto).not.toContain("button");
    const raiz = renderizacao?.root.findByType(View);
    expect(raiz?.props.accessible).toBe(true);
    expect(raiz?.props.accessibilityLabel).toContain("Força de terça");
    expect(renderizacao).toBeDefined();
    const imagem = renderizacao!.root.findByProps({ testID: "social-feed-media" });
    expect(imagem.props.accessibilityLabel).toBe("Força de terça");
    expect(imagem.props.source).toEqual({
      uri: "https://api.example.test/api/social/posts/post-1/media",
      headers: { Authorization: "Bearer token-de-teste" },
    });
  });
});
