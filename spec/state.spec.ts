import { State } from "../src";

const initState = [1, 2, 3, 4, 5, 6];

const addS = (n: number) => (s: number[]) => {
  const [first, ...rest] = s;
  return [n + first, rest] as const;
};

const subS = (n: number) => (s: number[]) => {
  const [first, ...rest] = s;
  return [(n - first).toString(), rest] as const;
};

const subSThrow = (n: number) => (s: number[]) => {
  const [first, ...rest] = s;
  throw new Error("i don't want no subs");
  return [(n - first).toString(), rest] as const;
};

const addSP = (n: number) => async (s: number[]) => {
  return new Promise<readonly [number, number[]]>(res => {
    global.setTimeout(() => {
      const [first, ...rest] = s;
      res([n + first, rest] as const);
    }, 0);
  });
};

const addSPReject = (n: number) => async (s: number[]) => {
  return new Promise<readonly [number, number[]]>((_, rej) => {
    global.setTimeout(() => {
      rej(n + s[0]);
    }, 0);
  });
};

describe("async monad stuff", () => {
  describe("State", () => {
    it("succeeds", async () => {
      const output = State.doM<number[]>()(async $ => {
        const v1 = await $(addS(10));
        const v2 = await $(subS(14));
        const ret = addS(v1 + parseInt(v2));
        return ret;
      });
      const [v, state] = await output(initState);
      expect(v).toEqual(26);
      expect(state).toEqual([4, 5, 6]);
    });
    it("can incorporate async", async () => {
      const output = State.doM<number[]>()(async $ => {
        const v1 = await $(addSP(10));
        const v2 = await $(subS(14));
        const ret = addS(v1 + parseInt(v2));
        return ret;
      });
      const [v, state] = await output(initState);
      expect(v).toEqual(26);
      expect(state).toEqual([4, 5, 6]);
    });
    it("allows exceptions to escape", async () => {
      try {
        const output = State.doM<number[]>()(async $ => {
          const v1 = await $(addS(10));
          const v2 = await $(subSThrow(14));
          const ret = addS(v1 + parseInt(v2));
          return ret;
        });
        const [v, state] = await output(initState);
        console.log([v, state]);
        throw "nope";
      } catch (e) {
        expect(e.message).toEqual("i don't want no subs");
      }
    });
    it("allows promises to escape", async () => {
      try {
        const output = State.doM<number[]>()(async $ => {
          const v1 = await $(addSPReject(10));
          const v2 = await $(subS(14));
          const ret = addS(v1 + parseInt(v2));
          return ret;
        });
        const [v, state] = await output(initState);
        console.log([v, state]);
        throw "nope";
      } catch (e) {
        expect(e).toEqual(11);
      }
    });
    it("allows inner monads to run successfully", async () => {
      const output = State.doM<number[]>()(async $ => {
        const v1 = await $(addSP(10)); // v1 = 11, state [2,3,4,5,6]
        const [v2] = await State.doM<number[]>()(async $$ => {
          const vInner = await $$(a => [5, a]);
          return a => [vInner + 2, a] as const;
        })([1]); // v2 = 5 + 2 = 7, state [2,3,4,5,6]
        return addS(v1 + v2); // 11 + 7 + 2 = 20, state [3,4,5,6]
      });
      const [v, state] = await output(initState);
      expect(v).toEqual(20);
      expect(state).toEqual([3, 4, 5, 6]);
    });
  });
  it("allows inner monads to fail without stopping", async () => {
    const output = State.doM<number[]>()(async $ => {
      const v1 = await $(addSP(10)); // v1 = 11, state [2,3,4,5,6]
      let v2: number;
      try {
        const arr = await State.doM<number[]>()(async $$ => {
          const vInner = await $$(a => [5, a]);
          return a => {
            throw "bad hombre";
            return [vInner + 2, a] as const;
          };
        })([1]);
        v2 = arr[0]; // not reached
      } catch {
        v2 = 3; // v2 = 3, state [2,3,4,5,6]
      }
      const ret = addS(v1 + v2); // 11 + 3 + 2 = 16, state [3,4,5,6]
      return ret;
    });
    const [v, state] = await output(initState);
    expect(v).toEqual(16);
    expect(state).toEqual([3, 4, 5, 6]);
  });
});
