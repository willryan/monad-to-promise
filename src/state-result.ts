import { makeDo } from "./do-m";
import { State, StateTuple } from "./state";
import { Result } from "./result";

type StateResult<TState, TSuccess, TFailure> = State<
  Result.Type<TSuccess, TFailure>,
  TState
>;

type StateResultBinder<TState, TFailure> = <T>(
  m: StateResult<TState, T, TFailure>
) => PromiseLike<T>;

export function doM<TState, TFailure>() {
  return function<T>(
    fn: (
      b: StateResultBinder<TState, TFailure>
    ) => Promise<StateResult<TState, T, TFailure>>
  ): (s: TState) => Promise<StateTuple<Result.Type<T, TFailure>, TState>> {
    return async (s: TState) => {
      let st = s;
      const doer = makeDo<T, StateResult<TState, T, TFailure>>(async m => {
        const v = await m;
        const [t, newSt] = await v(st);
        st = newSt;
        return t.type === Result.Status.SUCCESS
          ? { type: "res", value: t.value }
          : { type: "rej", value: (s: TState) => [t, s] };
      })(fn);
      return (await doer)(st);
    };
  };
}
