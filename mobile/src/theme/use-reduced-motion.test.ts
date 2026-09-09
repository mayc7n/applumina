import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo } from "react-native";

const mockDefinirReducao = jest.fn();
const mockCleanups: (void | (() => void))[] = [];

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useEffect: jest.fn((efeito: () => void | (() => void)) => {
    mockCleanups.push(efeito());
  }),
  useState: jest.fn(() => [null, mockDefinirReducao]),
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

describe("preferência de redução de movimento", () => {
  beforeEach(() => {
    mockAoAlterar = undefined;
    mockResolverPreferencia = undefined;
    mockCleanups.length = 0;
    mockDefinirReducao.mockClear();
    mockRemover.mockClear();
    mockAddEventListener.mockClear();
    mockIsReduceMotionEnabled.mockClear();
  });

  test("não deixa a resposta inicial tardia sobrescrever um evento recente", async () => {
    useReducaoMovimento();

    mockAoAlterar?.(true);
    mockResolverPreferencia?.(false);
    await Promise.resolve();

    expect(mockDefinirReducao).toHaveBeenCalledTimes(1);
    expect(mockDefinirReducao).toHaveBeenCalledWith(true);
  });

  test("remove o listener e ignora resposta tardia após desmontar", async () => {
    useReducaoMovimento();

    mockCleanups.forEach((cleanup) => cleanup?.());
    mockResolverPreferencia?.(false);
    await Promise.resolve();

    expect(mockRemover).toHaveBeenCalledTimes(1);
    expect(mockDefinirReducao).not.toHaveBeenCalled();
  });
});
