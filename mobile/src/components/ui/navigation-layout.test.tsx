import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Children, type ReactElement, type ReactNode } from "react";

const mockUseReducaoMovimento = jest.fn<() => boolean | null>();
const mockTabs = Object.assign(() => null, { Screen: () => null });

jest.mock("expo-router", () => ({ Tabs: mockTabs }));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock("lucide-react-native", () => ({
  CheckSquare2: () => null,
  Dumbbell: () => null,
  Home: () => null,
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
  children: ReactNode;
  screenOptions: {
    animation: string;
    tabBarHideOnKeyboard: boolean;
    tabBarStyle: Record<string, unknown>;
  };
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

  test("mantém quatro destinos diários e uma barra compacta", () => {
    mockUseReducaoMovimento.mockReturnValue(false);

    const abas = LayoutAbas() as ReactElement<TabsPropsTest>;
    const telas = Children.toArray(abas.props.children) as ReactElement<{
      name: string;
    }>[];

    expect(telas.map((tela) => tela.props.name)).toEqual([
      "home",
      "tasks",
      "workouts",
      "friends",
    ]);
    expect(abas.props.screenOptions).toMatchObject({
      tabBarHideOnKeyboard: true,
      tabBarStyle: {
        height: 62,
        marginBottom: 6,
        shadowOpacity: 0.06,
      },
    });
  });
});
