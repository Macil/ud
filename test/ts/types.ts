import * as ud from '../..';

// This file isn't executed. Typescript just checks it for type safety.
function foo() {
  ud.markReloadable(module);
  const once: number = ud.defonce(module, () => 3);
  const once_: number = ud.defonce(module, () => 3, 'xyz');
  const once__: number = ud.defonce(module, () => 3, undefined);
  const obj: {a: number} = ud.defobj(module, {a: 3});
  const fn: () => number = ud.defn(module, () => 5);
}
