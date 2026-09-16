import { describe, expect, jest, test } from "@jest/globals";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

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

jest.mock("lucide-react-native", () => ({
  Heart: () => null,
}));

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
  title: "WORKOUT",
  description: "Treino leve",
  emoji: "🏋️",
  likeCount: 3,
  liked: false,
  createdAt: "2030-06-10T12:00:00Z",
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
    expect(texto).toContain("Treino leve");
    expect(texto).toContain("3 curtidas");
    expect(texto).not.toContain("button");
  });
});
