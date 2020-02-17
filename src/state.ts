import { makeDo } from "./do-m";

export type StateTuple<T, S> = readonly [T, S];

export type State<T, S> = (
  s: S
) => StateTuple<T, S> | Promise<StateTuple<T, S>>;

type StateBinder<S> = <T>(m: State<T, S>) => PromiseLike<T>;

export function doM<S>() {
  return function<T>(
    fn: (b: StateBinder<S>) => Promise<State<T, S>>
  ): (s: S) => Promise<StateTuple<T, S>> {
    return async (s: S) => {
      let st = s;
      const doer = makeDo<T, State<T, S>>(async m => {
        const v = await m;
        const [t, newSt] = await v(st);
        st = newSt;
        return { type: "res", value: t };
      })(fn);
      return (await doer)(st);
    };
  };
}
