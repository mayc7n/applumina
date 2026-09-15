import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "@jest/globals";

const telasForaDasAbas = [
  "../../app/(app)/workouts/[id].tsx",
  "../../app/(app)/workouts/new.tsx",
  "../../app/(app)/friends/blocked.tsx",
  "../../app/(app)/friends/safety/[id].tsx",
];

describe("safe area das telas fora das abas", () => {
  test.each(telasForaDasAbas)("inclui o inset inferior em %s", (caminho) => {
    const fonte = readFileSync(resolve(__dirname, caminho), "utf8");

    expect(fonte).toMatch(/edges=\{\["top", "left", "right", "bottom"\]\}/);
  });
});
