import { StateResult } from "../src";
import { Result } from "../src";

type State = number[];
enum Failure {
  FIZZ = "FIZZ",
  BUZZ = "BUZZ",
  FIZZBUZZ = "FIZZBUZZ"
}

const fizz = (s: State): [Result.Type<number, Failure>, State] => {
  if (s.length === 0) {
    throw "too short";
  }
  const [f, ...r] = s;
  if (f % 3 === 0) {
    return [Result.failure(Failure.FIZZ), r];
  }
  return [Result.success(f), r];
};

const buzz = async (
  s: State
): Promise<[Result.Type<number, Failure>, State]> => {
  if (s.length === 0) {
    throw "too short";
  }
  const [f, ...r] = s;
  if (f % 5 === 0) {
    return [Result.failure(Failure.BUZZ), r];
  }
  return [Result.success(f), r];
};

const fizzBuzz = (s: State): [Result.Type<number, Failure>, State] => {
  if (s.length === 0) {
    throw "too short";
  }
  const [f, ...r] = s;
  if (f % 15 === 0) {
    return [Result.failure(Failure.FIZZBUZZ), r];
  }
  return [Result.success(f), r];
};

const subject = StateResult.doM<State, Failure>()(async $ => {
  const one = await $(fizz);
  const two = await $(buzz);
  const three = await $(fizzBuzz);
  return s => [Result.success(one + two + three), s];
});

describe("state-result monad", () => {
  it("succeeds", async () => {
    const [value, st] = await subject([1, 2, 4, 5]);
    if (value.type !== Result.Status.SUCCESS) {
      throw "fail";
    }
    expect(value.value).toEqual(7);
    expect(st).toEqual([5]);
  });
  it("fails", async () => {
    const [value, st] = await subject([1, 5, 4, 5]);
    if (value.type !== Result.Status.FAILURE) {
      throw "success";
    }
    expect(value.value).toEqual(Failure.BUZZ);
    expect(st).toEqual([4, 5]);
  });
  it("surfaces exceptions", async () => {
    try {
      await subject([1, 2]);
      throw "oh no";
    } catch (e) {
      expect(e).toEqual("too short");
    }
  });
});
