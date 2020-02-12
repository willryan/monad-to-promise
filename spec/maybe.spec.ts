import { Maybe } from "../src";

function maybe1(n: number): Maybe.Maybe<number> {
  return n % 2 === 0 ? Maybe.Just(n / 2) : Maybe.Nothing();
}
function maybe2(n: string): Maybe.Maybe<number> {
  try {
    const value = Number.parseInt(n);
    if (Number.isNaN(value)) {
      return Maybe.Nothing();
    }
    return Maybe.Just(value);
  } catch {
    return Maybe.Nothing();
  }
}
function maybeP(n: number): Promise<Maybe.Maybe<number>> {
  return new Promise(res => {
    global.setTimeout(() => {
      res(n % 2 === 0 ? Maybe.Just(n / 2) : Maybe.Nothing());
    }, 0);
  });
}

function maybePReject(n: number): Promise<Maybe.Maybe<number>> {
  return new Promise((_, rej) => {
    global.setTimeout(() => {
      rej("baaaaad " + n);
    }, 0);
  });
}

describe("async monad stuff", () => {
  describe("Maybe", () => {
    it("succeeds", async () => {
      const output = await Maybe.doM(async $ => {
        const v1 = await $(maybe1(10));
        const v2 = await $(maybe2((v1 + 3).toString()));
        return Maybe.Just(v2 + 1);
      });
      expect(output).toEqual(Maybe.Just(9));
    });
    it("can incorporate async", async () => {
      const output = await Maybe.doM(async $ => {
        const v1 = await $(maybeP(10));
        const v2 = await $(maybe2((v1 + 3).toString()));
        return Maybe.Just(v2 + 1);
      });
      expect(output).toEqual(Maybe.Just(9));
    });
    it("stops early", async () => {
      const output = await Maybe.doM(async $ => {
        const may1 = maybe1(10);
        const v1 = await $(may1);
        const v2 = await $(maybe2(("garbage" + v1 + 3).toString()));
        return Maybe.Just(v2 + 1);
      });
      //console.log("output", output);
      expect(output).toEqual(Maybe.Nothing());
    });
    it("stops early async", async () => {
      try {
        const output = await Maybe.doM(async $ => {
          const may1 = maybePReject(10);
          const v1 = await $(may1);
          const v2 = await $(maybe2(("garbage" + v1 + 3).toString()));
          return Maybe.Just(v2 + 1);
        });
        console.log("output", output);
        throw "nope";
      } catch (e) {
        expect(e).toEqual("baaaaad 10");
      }
    });
    it("allows other exceptions to escape", async () => {
      try {
        const output = await Maybe.doM(async $ => {
          const may1 = maybe1(10);
          const v1 = await $(may1);
          throw new Error("stop early");
          const v2 = await $(maybe2((v1 + 3).toString()));
          return Maybe.Just(v2 + 1);
        });
        console.log("output", output);
        throw "nope";
      } catch (e) {
        expect(e.message).toEqual("stop early");
      }
    });
    it("allows other promises to escape", async () => {
      async function badPromise() {
        return new Promise<number>((_res, rej) => {
          global.setTimeout(() => {
            rej("stop early");
          }, 1);
        });
      }
      try {
        const output = await Maybe.doM(async $ => {
          const may1 = maybe1(10);
          const v1 = await $(may1);
          const v2 = await badPromise();
          const v3 = await $(maybe2((v1 + v2 + 3).toString()));
          return Maybe.Just(v3 + 1);
        });
        console.log("output", output);
        throw "nope";
      } catch (e) {
        expect(e).toEqual("stop early");
      }
    });
    it("allows inner monads to fail without stopping", async () => {
      const output = await Maybe.doM(async $ => {
        const may1 = maybe1(10);
        const v1 = await $(may1);
        const v2 = await Maybe.doM(async $$ => {
          const ret = await $$(maybe2("garbage" + (v1 + 3).toString()));
          return Maybe.Just(ret);
        });
        if (v2.type === "Nothing") {
          return Maybe.Just("huzzah");
        }
        return Maybe.Just((v2.value + 1).toString());
      });
      expect(output).toEqual(Maybe.Just("huzzah"));
    });
  });
});
