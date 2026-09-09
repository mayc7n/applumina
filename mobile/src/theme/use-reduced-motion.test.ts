import { describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo } from "react-native";

const mockDefinidores: jest.Mock[] = [];
const mockCleanups: (void | (() => void))[] = [];

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useEffect: jest.fn((efeito: () => void | (() => void)) => {
    mockCleanups.push(efeito());
  }),
  useState: jest.fn((inicial: unknown | (() => unknown)) => {
    const definir = jest.fn();
    mockDefinidores.push(definir);
    return [
      typeof inicial === "function" ? (inicial as () => unknown)() : inicial,
      definir,
    ];
  }),
}));

let mockAoAlterar: ((reduzir: boolean) => void) | undefined;
let mockResolverPreferencia: ((reduzir: boolean) => void) | undefined;
const mockRemover = jest.fn();
const mockAddEventListener = jest
  .spyOn(AccessibilityInfo, "addEventListener")
  .mockImplementation(
    ((_evento: string, aoAlterar: (reduzir: boolean) => void) => {
      mockAoAlterar = aoAlterar;
      return { remove: mockRemover };
    }) as never,
  );
const mockIsReduceMotionEnabled = jest
  .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
  .mockImplementation(
    () =>
      new Promise<boolean>((resolver) => {
        mockResolverPreferencia = resolver;
      }),
  );

const { useReducaoMovimento } = jest.requireActual<
  typeof import("./use-reduced-motion")
>("./use-reduced-motion");

describe("preferência compartilhada de redução de movimento", () => {
  test("compartilha listener, preserva evento recente, cacheia e limpa", async () => {
    expect(useReducaoMovimento()).toBeNull();
    expect(useReducaoMovimento()).toBeNull();
    expect(mockAddEventListener).toHaveBeenCalledTimes(1);
    expect(mockIsReduceMotionEnabled).toHaveBeenCalledTimes(1);

    mockAoAlterar?.(true);
    mockResolverPreferencia?.(false);
    await Promise.resolve();

    expect(mockDefinidores[0]).toHaveBeenCalledTimes(1);
    expect(mockDefinidores[0]).toHaveBeenCalledWith(true);
    expect(mockDefinidores[1]).toHaveBeenCalledTimes(1);
    expect(mockDefinidores[1]).toHaveBeenCalledWith(true);
    expect(useReducaoMovimento()).toBe(true);
    expect(mockAddEventListener).toHaveBeenCalledTimes(1);

    mockCleanups.splice(0).forEach((cleanup) => cleanup?.());
    expect(mockRemover).toHaveBeenCalledTimes(1);

    expect(useReducaoMovimento()).toBe(true);
    const definirDepoisDeDesmontar = mockDefinidores.at(-1)!;
    const cleanupFinal = mockCleanups.at(-1);
    cleanupFinal?.();
    mockResolverPreferencia?.(false);
    await Promise.resolve();

    expect(mockRemover).toHaveBeenCalledTimes(2);
    expect(definirDepoisDeDesmontar).not.toHaveBeenCalled();
  });
});
