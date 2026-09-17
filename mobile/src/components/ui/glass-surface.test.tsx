import { describe, expect, jest, test } from "@jest/globals";
import { act, create } from "react-test-renderer";
import { Text } from "react-native";

const mockUseTemaApp = jest.fn();
const mockBlurView = (props: Record<string, unknown>) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View: NativeView } = require("react-native") as typeof import("react-native");
  return <NativeView testID="glass-blur" {...props} />;
};

jest.mock("expo-blur", () => ({
  BlurView: mockBlurView,
}));

jest.mock("@/theme/theme", () => ({
  useTemaApp: mockUseTemaApp,
}));

const { GlassSurface } = jest.requireActual<
  typeof import("./glass-surface")
>("./glass-surface");

describe("GlassSurface", () => {
  test("aplica blur claro padrão e preserva o conteúdo acessível", async () => {
    mockUseTemaApp.mockReturnValue({
      escuro: false,
      cores: {
        vidro: "rgba(255,255,255,0.72)",
        vidroBorda: "rgba(255,255,255,0.86)",
        vidroReflexo: "rgba(255,255,255,0.56)",
        vidroSombra: "rgba(114,57,43,0.16)",
      },
    });

    let renderizacao: ReturnType<typeof create> | undefined;
    await act(async () => {
      renderizacao = create(
        <GlassSurface accessibilityLabel="superfície acessível">
          <Text>conteudo acessivel</Text>
        </GlassSurface>,
      );
    });

    const blur = renderizacao!.root.findByProps({ testID: "glass-blur" });
    expect(blur.props.intensity).toBe(28);
    expect(blur.props.tint).toBe("light");
    expect(
      renderizacao!.root.findByProps({ children: "conteudo acessivel" }),
    ).toBeDefined();
    expect(
      renderizacao!.root.findByProps({
        accessibilityLabel: "superfície acessível",
      }),
    ).toBeDefined();
  });

  test("usa tint escuro e intensidade personalizada", async () => {
    mockUseTemaApp.mockReturnValue({
      escuro: true,
      cores: {
        vidro: "rgba(36,29,26,0.80)",
        vidroBorda: "rgba(255,255,255,0.14)",
        vidroReflexo: "rgba(255,255,255,0.10)",
        vidroSombra: "rgba(0,0,0,0.34)",
      },
    });

    let renderizacao: ReturnType<typeof create> | undefined;
    await act(async () => {
      renderizacao = create(
        <GlassSurface intensidade={42}>
          <Text>escuro</Text>
        </GlassSurface>,
      );
    });

    const blur = renderizacao!.root.findByProps({ testID: "glass-blur" });
    expect(blur.props.intensity).toBe(42);
    expect(blur.props.tint).toBe("dark");
  });
});
