import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Children, type ReactElement, type ReactNode } from "react";

const mockUseReducaoMovimento = jest.fn<() => boolean | null>();
const mockUseWindowDimensions = jest.fn(() => ({ fontScale: 1 }));
let mockInsetsBottom = 0;
const mockTabs = Object.assign(() => null, { Screen: () => null });

jest.mock("expo-router", () => ({ Tabs: mockTabs }));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: mockInsetsBottom, left: 0, right: 0, top: 0 }),
}));

jest.mock(
  "react-native/Libraries/Utilities/useWindowDimensions",
  () => ({ __esModule: true, default: mockUseWindowDimensions }),
);

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
    animation: "none" | "shift";
    tabBarAllowFontScaling: boolean;
    tabBarHideOnKeyboard: boolean;
    tabBarItemStyle: Record<string, unknown>;
    tabBarLabelStyle: Record<string, unknown>;
    tabBarStyle: Record<string, unknown>;
    tabBarVisibilityAnimationConfig?: {
      hide: { animation: "timing"; config: { duration: number } };
      show: { animation: "timing"; config: { duration: number } };
    };
  };
}

describe("movimento da navegação inferior", () => {
  beforeEach(() => {
    mockUseReducaoMovimento.mockReset();
    mockUseWindowDimensions.mockReturnValue({ fontScale: 1 });
    mockInsetsBottom = 0;
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
      expect(abas.props.screenOptions.tabBarVisibilityAnimationConfig).toEqual({
        hide: { animation: "timing", config: { duration: 0 } },
        show: { animation: "timing", config: { duration: 0 } },
      });
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
      tabBarAllowFontScaling: true,
      tabBarHideOnKeyboard: true,
      tabBarItemStyle: {
        overflow: "visible",
      },
      tabBarStyle: {
        height: 62,
        marginBottom: 6,
        shadowOpacity: 0.06,
      },
    });
  });

  test.each([1.3, 1.6, 2])(
    "acomoda fontScale %s sem manter a altura mínima fixa",
    (fontScale) => {
      mockUseReducaoMovimento.mockReturnValue(false);
      mockUseWindowDimensions.mockReturnValue({ fontScale });

      const abas = LayoutAbas() as ReactElement<TabsPropsTest>;
      const estilo = abas.props.screenOptions.tabBarStyle;

      expect(estilo.height).toBe(62 + Math.ceil((fontScale - 1) * 16));
      expect(estilo.paddingBottom).toBe(4);
      expect(abas.props.screenOptions.tabBarLabelStyle).toEqual(
        expect.objectContaining({ overflow: "visible" }),
      );
    },
  );

  test("soma o inset inferior sem cortar a área útil da barra", () => {
    mockUseReducaoMovimento.mockReturnValue(false);
    mockInsetsBottom = 34;

    const abas = LayoutAbas() as ReactElement<TabsPropsTest>;
    const estilo = abas.props.screenOptions.tabBarStyle;

    expect(estilo.height).toBe(96);
    expect(estilo.paddingBottom).toBe(38);
  });
});
