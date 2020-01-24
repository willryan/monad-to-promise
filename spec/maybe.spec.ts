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

describe("async monad stuff", () => {
  describe("Maybe", () => {
    it("succeeds", async () => {
      const output = await Maybe.doM(async b => {
        const may1 = maybe1(10);
        const v1 = await b(may1);
        const v2 = await b(maybe2((v1 + 3).toString()));
        return Maybe.Just(v2 + 1);
      });
      expect(output).toEqual(Maybe.Just(9));
    });
    it("stops early", async () => {
      const output = await Maybe.doM(async b => {
        const may1 = maybe1(10);
        const v1 = await b(may1);
        const v2 = await b(maybe2(("garbage" + v1 + 3).toString()));
        return Maybe.Just(v2 + 1);
      });
      //console.log("output", output);
      expect(output).toEqual(Maybe.Nothing());
    });
    it("allows other exceptions to escape", async () => {
      try {
        const output = await Maybe.doM(async b => {
          const may1 = maybe1(10);
          const v1 = await b(may1);
          throw new Error("stop early");
          const v2 = await b(maybe2((v1 + 3).toString()));
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
          window.setTimeout(() => {
            rej("stop early");
          }, 1);
        });
      }
      try {
        const output = await Maybe.doM(async b => {
          const may1 = maybe1(10);
          const v1 = await b(may1);
          const v2 = await badPromise();
          const v3 = await b(maybe2((v1 + v2 + 3).toString()));
          return Maybe.Just(v3 + 1);
        });
        console.log("output", output);
        throw "nope";
      } catch (e) {
        expect(e).toEqual("stop early");
      }
    });
    it("allows inner monads to fail without stopping", async () => {
      const output = await Maybe.doM(async b => {
        const may1 = maybe1(10);
        const v1 = await b(may1);
        const v2 = await Maybe.doM(async b2 => {
          const ret = await b2(maybe2("garbage" + (v1 + 3).toString()));
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
