// Defensive DOM lookups for the extracted desktop behavior modules.
//
// The frozen baseline bound behavior against fixed ids/selectors. A missing
// *required* element previously surfaced as a cryptic "cannot read property of
// null" at first use; these helpers fail loudly with a named error instead.
// The *optional* lookups stay nullable so callers reproduce the source's
// `if (el) ...` guards exactly; normal behavior is unchanged.

export function requireById<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`[eclipse-os] required element #${id} not found`);
  return el as T;
}

export function getById<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function requireQuery<T extends Element = Element>(
  selector: string,
  scope: ParentNode = document,
): T {
  const el = scope.querySelector<T>(selector);
  if (!el) throw new Error(`[eclipse-os] required element "${selector}" not found`);
  return el;
}

export function getQuery<T extends Element = Element>(
  selector: string,
  scope: ParentNode = document,
): T | null {
  return scope.querySelector<T>(selector);
}

export function queryAll<T extends Element = Element>(
  selector: string,
  scope: ParentNode = document,
): T[] {
  return Array.from(scope.querySelectorAll<T>(selector));
}
