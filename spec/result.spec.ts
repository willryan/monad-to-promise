import { Result } from "../src";

enum Errors {
  ONE,
  TWO,
  THREE
}

function maybe1(n: number): Result.Type<number, Errors> {
  return n % 2 === 0 ? Result.success(n / 2) : Result.failure(Errors.ONE);
}
function maybe2(n: string): Result.Type<number, Errors.TWO> {
  try {
    const value = Number.parseInt(n);
    if (Number.isNaN(value)) {
      return Result.failure(Errors.TWO);
    }
    return Result.success(value);
  } catch {
    return Result.failure(Errors.TWO);
  }
}

describe("async monad stuff", () => {
  describe("Result", () => {
    it("succeeds", async () => {
      const output = await Result.doM<Errors>()(async b => {
        const may1 = maybe1(10);
        const v1 = await b(may1);
        const v2 = await b(maybe2((v1 + 3).toString()));
        return Result.success(v2 + 1);
      });
      expect(output).toEqual(Result.success(9));
    });
    it("stops early", async () => {
      const output = await Result.doM<Errors>()(async b => {
        const may1 = maybe1(10);
        const v1 = await b(may1);
        const v2 = await b(maybe2(("garbage" + v1 + 3).toString()));
        return Result.success(v2 + 1);
      });
      //console.log("output", output);
      expect(output).toEqual(Result.failure(Errors.TWO));
    });
    it("allows other exceptions to escape", async () => {
      try {
        const output = await Result.doM<Errors>()(async b => {
          const may1 = maybe1(10);
          const v1 = await b(may1);
          throw new Error("stop early");
          const v2 = await b(maybe2((v1 + 3).toString()));
          return Result.success(v2 + 1);
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
        const output = await Result.doM<Errors>()(async b => {
          const may1 = maybe1(10);
          const v1 = await b(may1);
          const v2 = await badPromise();
          const v3 = await b(maybe2((v1 + v2 + 3).toString()));
          return Result.success(v3 + 1);
        });
        console.log("output", output);
        throw "nope";
      } catch (e) {
        expect(e).toEqual("stop early");
      }
    });
    it("allows inner monads to fail without stopping", async () => {
      const output = await Result.doM<Errors>()(async b => {
        const may1 = maybe1(10);
        const v1 = await b(may1);
        const v2 = await Result.doM<Errors.TWO>()(async b2 => {
          const ret = await b2(maybe2("garbage" + (v1 + 3).toString()));
          return Result.success(ret);
        });
        if (Result.isFailure(v2)) {
          return Result.success("huzzah");
        }
        return Result.success((v2.value + 1).toString());
      });
      expect(output).toEqual(Result.success("huzzah"));
    });
  });
});
