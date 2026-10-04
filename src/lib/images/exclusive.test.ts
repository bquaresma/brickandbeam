import { describe, expect, it } from "vitest";

import { runExclusive } from "./exclusive";

describe("runExclusive", () => {
  it("runs tasks one at a time, in order", async () => {
    const log: string[] = [];
    const task = (name: string, ms: number) => () =>
      new Promise<string>((resolve) => {
        log.push(`start ${name}`);
        setTimeout(() => {
          log.push(`end ${name}`);
          resolve(name);
        }, ms);
      });

    const results = await Promise.all([
      runExclusive(task("a", 30)),
      runExclusive(task("b", 5)),
      runExclusive(task("c", 1)),
    ]);

    expect(results).toEqual(["a", "b", "c"]);
    expect(log).toEqual(["start a", "end a", "start b", "end b", "start c", "end c"]);
  });

  it("keeps going after a task fails", async () => {
    await expect(
      runExclusive(async () => Promise.reject(new Error("boom"))),
    ).rejects.toThrow("boom");
    await expect(runExclusive(async () => "still works")).resolves.toBe("still works");
  });
});
