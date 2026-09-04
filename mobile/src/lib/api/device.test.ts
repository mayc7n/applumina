import { describe, expect, test } from "@jest/globals";

import { criarCabecalhosAparelho } from "./device";

describe("criarCabecalhosAparelho", () => {
  test("identifica um aparelho Android sem enviar dados pessoais", () => {
    expect(criarCabecalhosAparelho("android", 36)).toEqual({
      "X-Device-Type": "MOBILE_ANDROID",
      "X-Device-Name": "Android 36",
    });
  });

  test("identifica um aparelho Apple de forma legível", () => {
    expect(criarCabecalhosAparelho("ios", "18.5")).toEqual({
      "X-Device-Type": "MOBILE_IOS",
      "X-Device-Name": "iOS 18.5",
    });
  });
});
