/// <reference types="node" />

export function markReloadable(module_: typeof module): void;
export function defonce<T>(module_: typeof module, fn: ()=>T, key?:string): T;
export function defobj<T extends object>(module_: typeof module, object: T, key?:string): T;
export function defn<T extends Function>(module_: typeof module, fn: T, key?:string): T;
