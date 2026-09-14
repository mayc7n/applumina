import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";

const mockUseReducaoMovimento = jest.fn<() => boolean | null>();
const mockTabs = Object.assign(() => null, { Screen: () => null });

jest.mock("expo-router", () => ({ Tabs: mockTabs }));

jest.mock("lucide-react-native", () => ({
  CheckSquare2: () => null,
  Dumbbell: () => null,
  Home: () => null,
  UserRound: () => null,
  UsersRound: () => null,
}));

jest.mock("@/i18n/idioma", () => ({
  useIdioma: () => ({ traduzir: (chave: string) => chave }),
}));

jest.mock("@/theme/theme", () => ({
  useTemaApp: () => ({
    escuro: false,
    cores: {
      borda: "#ddd",
      elevado: "#fff",
      marca: "#c00",
      marcaContorno: "#fcc",
      marcaSuave: "#fee",
      sobreMarca: "#fff",
      texto: "#111",
      textoSutil: "#777",
    },
  }),
}));

jest.mock("@/theme/use-reduced-motion", () => ({
  useReducaoMovimento: mockUseReducaoMovimento,
}));

const LayoutAbas = jest.requireActual<
  typeof import("../../app/(app)/(tabs)/_layout")
>("../../app/(app)/(tabs)/_layout").default;

interface TabsPropsTest {
  screenOptions: { animation: string };
}

describe("movimento da navegação inferior", () => {
  beforeEach(() => {
    mockUseReducaoMovimento.mockReset();
  });

  test("mantém shift quando redução de movimento está desativada", () => {
    mockUseReducaoMovimento.mockReturnValue(false);

    const abas = LayoutAbas() as ReactElement<TabsPropsTest>;

    expect(abas.props.screenOptions.animation).toBe("shift");
  });

  test.each([true, null])(
    "remove transição quando redução de movimento é %s",
    (reduzirMovimento) => {
      mockUseReducaoMovimento.mockReturnValue(reduzirMovimento);

      const abas = LayoutAbas() as ReactElement<TabsPropsTest>;

      expect(abas.props.screenOptions.animation).toBe("none");
    },
  );
});
