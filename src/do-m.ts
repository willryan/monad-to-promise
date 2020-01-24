export type Resolver<TRes, TRej, MT> = (
  m: MT
) => { type: "res"; value: TRes } | { type: "rej"; value: TRej };
export type Binder = <MT, T>(m: MT) => PromiseLike<T>;

export function makeDo<T, MT>(r: Resolver<T, any, MT>) {
  return function(fn: (b: Binder) => Promise<MT>) {
    const binder: Binder = (m): PromiseLike<any> => {
      const out = r(m as any);
      if (out.type === "res") {
        return Promise.resolve(out.value);
      } else {
        return Promise.reject({ __binder: binder, value: out.value });
      }
    };
    return fn(binder).catch(e => {
      if (e && e.__binder === binder) {
        return e.value;
      } else {
        //console.log("reject", e);
        return Promise.reject(e);
      }
    });
  };
}
