import { describe, expect, jest, test } from "@jest/globals";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

const mockUseTemaApp = jest.fn();
const mockThemeProvider = ({ children }: { children: ReactNode }) => children;

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useEffect: jest.fn(),
}));

jest.mock("expo-router", () => ({
  DarkTheme: {
    dark: true,
    colors: {
      background: "fundo-padrao-escuro",
      border: "borda-padrao-escuro",
      card: "cartao-padrao-escuro",
      notification: "notificacao-padrao-escuro",
      primary: "primaria-padrao-escuro",
      text: "texto-padrao-escuro",
    },
    fonts: {},
  },
  DefaultTheme: {
    dark: false,
    colors: {
      background: "fundo-padrao-claro",
      border: "borda-padrao-claro",
      card: "cartao-padrao-claro",
      notification: "notificacao-padrao-claro",
      primary: "primaria-padrao-claro",
      text: "texto-padrao-claro",
    },
    fonts: {},
  },
  Slot: () => null,
  ThemeProvider: mockThemeProvider,
}));

jest.mock("expo-splash-screen", () => ({
  hideAsync: jest.fn(),
  preventAutoHideAsync: jest.fn(),
}));

jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));

jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("@/components/ui/offline-banner", () => ({
  OfflineBanner: () => null,
}));

jest.mock("@/providers/query-provider", () => ({
  ProvedorConsultas: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("@/store/auth-store", () => ({
  useArmazenamentoAutenticacao: (seletor: (estado: unknown) => unknown) =>
    seletor({ estado: "nao_autenticado", inicializar: jest.fn() }),
}));

jest.mock("@/theme/theme", () => ({ useTemaApp: mockUseTemaApp }));

const LayoutRaiz = jest.requireActual<typeof import("../../app/_layout")>(
  "../../app/_layout",
).default;

function encontrarElemento(
  raiz: ReactNode,
  predicado: (elemento: ReactElement<Record<string, unknown>>) => boolean,
): ReactElement<Record<string, unknown>> | undefined {
  if (!isValidElement<Record<string, unknown>>(raiz)) return undefined;
  if (predicado(raiz)) return raiz;

  for (const filho of Children.toArray(raiz.props.children as ReactNode)) {
    const encontrado = encontrarElemento(filho, predicado);
    if (encontrado) return encontrado;
  }

  return undefined;
}

describe("tema da navegação", () => {
  test.each([
    [
      "claro",
      {
        escuro: false,
        cores: {
          borda: "borda-lumina-clara",
          elevado: "elevado-lumina-claro",
          fundo: "fundo-lumina-claro",
          informacao: "informacao-lumina-clara",
          marca: "marca-lumina-clara",
          texto: "texto-lumina-claro",
          vidro: "vidro-lumina-claro",
          vidroBorda: "vidro-borda-lumina-claro",
        },
      },
      {
        background: "fundo-lumina-claro",
        border: "vidro-borda-lumina-claro",
        card: "vidro-lumina-claro",
        notification: "notificacao-padrao-claro",
        primary: "primaria-padrao-claro",
        text: "texto-padrao-claro",
      },
    ],
    [
      "escuro",
      {
        escuro: true,
        cores: {
          borda: "borda-lumina-escura",
          elevado: "elevado-lumina-escuro",
          fundo: "fundo-lumina-escuro",
          informacao: "informacao-lumina-escura",
          marca: "marca-lumina-escura",
          texto: "texto-lumina-escuro",
          vidro: "vidro-lumina-escuro",
          vidroBorda: "vidro-borda-lumina-escuro",
        },
      },
      {
        background: "fundo-lumina-escuro",
        border: "vidro-borda-lumina-escuro",
        card: "vidro-lumina-escuro",
        notification: "notificacao-padrao-escuro",
        primary: "primaria-padrao-escuro",
        text: "texto-padrao-escuro",
      },
    ],
  ])("usa o fundo e a superfície do tema %s na navegação", (_nome, tema, coresEsperadas) => {
    mockUseTemaApp.mockReturnValue(tema);

    const layout = LayoutRaiz();
    const provedor = encontrarElemento(
      layout,
      (elemento) => elemento.type === mockThemeProvider,
    );

    expect(provedor?.props.value).toMatchObject({
      dark: tema.escuro,
      colors: coresEsperadas,
    });
  });
});
