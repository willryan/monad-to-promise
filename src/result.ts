import { makeDo } from "./do-m";

export module Result {
  /**
   * `Result` or `Either` generic type, meaning it captures the success or failure of an operation.
   */
  export enum Status {
    SUCCESS = "SUCCESS",
    FAILURE = "FAILURE"
  }

  export interface SuccessType<TSuccess> {
    readonly type: Status.SUCCESS;
    readonly value: TSuccess;
  }
  export interface FailureType<TFailure> {
    type: Status.FAILURE;
    value: TFailure;
  }

  export type Type<TSuccess, TFailure> =
    | SuccessType<TSuccess>
    | FailureType<TFailure>;

  export function success<TSuccess>(value: TSuccess): SuccessType<TSuccess> {
    return { type: Status.SUCCESS, value };
  }

  export function failure<TFailure>(value: TFailure): FailureType<TFailure> {
    return { type: Status.FAILURE, value };
  }

  export function isSuccess<TSuccess, TFailure>(
    result: Type<TSuccess, TFailure>
  ): result is SuccessType<TSuccess> {
    return result.type === Status.SUCCESS;
  }

  export function isFailure<TSuccess, TFailure>(
    result: Type<TSuccess, TFailure>
  ): result is FailureType<TFailure> {
    return result.type === Status.FAILURE;
  }

  type ResultBinder<R> = <T>(
    m: Type<T, R> | Promise<Type<T, R>>
  ) => PromiseLike<T>;

  export function doM<R>() {
    return function<T>(
      fn: (b: ResultBinder<R>) => Promise<Type<T, R>>
    ): Promise<Type<T, R>> {
      return makeDo<T, Type<T, R>>(async m => {
        const v = await m;
        return v.type === Status.SUCCESS
          ? { type: "res", value: v.value }
          : { type: "rej", value: m };
      })(fn);
    };
  }
}
