/** OWNER: shared/dom — query helpers */
export const $ = <T extends Element = Element>(sel: string, root: ParentNode = document) =>
  root.querySelector(sel) as T | null;

export const $$ = <T extends Element = Element>(sel: string, root: ParentNode = document) =>
  [...root.querySelectorAll(sel)] as T[];
