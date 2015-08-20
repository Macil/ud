//jshint ignore:start

declare module ud {
  declare function markReloadable(module: typeof module): void;
  declare function defonce<T>(module: typeof module, fn: ()=>T, key?: string): T;
  declare function defobj<T: Object>(module: typeof module, object: T, key?: string): T;
  declare function defn<T: Function>(module: typeof module, fn: T, key?: string): T;
}
