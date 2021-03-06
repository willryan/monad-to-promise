import { makeDo } from "./do-m";

export type Just<T> = { type: "Just"; value: T };
export type Nothing = { type: "Nothing" };
export type Maybe<T> = Just<T> | Nothing;

type MaybeBinder = <T>(m: Maybe<T> | Promise<Maybe<T>>) => PromiseLike<T>;

const _nothing: Nothing = { type: "Nothing" };

export function Just<T>(t: T): Just<T> {
  return { type: "Just", value: t };
}
export function Nothing(): Nothing {
  return _nothing;
}
export function map<T, U>(m: Maybe<T>, fn: (t: T) => U): Maybe<U> {
  return m.type === "Just" ? Just(fn(m.value)) : Nothing();
}
export function bind<T, U>(m: Maybe<T>, fn: (t: T) => Maybe<U>): Maybe<U> {
  return m.type === "Just" ? fn(m.value) : Nothing();
}
export function doM<T>(
  fn: (b: MaybeBinder) => Promise<Maybe<T>>
): Promise<Maybe<T>> {
  return makeDo<T, Maybe<T>>(async m => {
    const v = await m;
    return v.type === "Just"
      ? { type: "res", value: v.value }
      : { type: "rej", value: Nothing() };
  })(fn);
}
