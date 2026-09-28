import { toRaw } from "vue";
// Attribute descriptions are authored in source, never from users or the network.
export function attributes(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  const props = {};
  for (const match of String(value).matchAll(
    /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g,
  )) {
    const [, name, double, single, bare] = match;
    if (/^on/i.test(name)) continue;
    props[name] = double ?? single ?? bare ?? true;
  }
  return props;
}
export const fallback = (items, empty) => (items?.length ? items : empty);
export const clone = (value) => structuredClone(toRaw(value));
