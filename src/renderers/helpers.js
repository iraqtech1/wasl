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

export const PHONE_LENGTH = 11;
// Field names that hold a phone number, shared by the sanitiser and the submit check.
export const PHONE_FIELDS = new Set(["phone", "phone2", "senderPhone"]);
// Shared attributes: digits-only keyboard, eleven-digit pattern, LTR alignment.
export const PHONE_ATTRIBUTES =
  'type="text" inputmode="numeric" pattern="[0-9]{11}" minlength="11" maxlength="11" dir="ltr"';

// Arabic-Indic (٠-٩) and Persian (۰-۹) digits mapped to their English (0-9) forms.
export function toEnglishDigits(value) {
  return String(value ?? "")
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

// Keep English digits only and cap the value at eleven characters.
export function phoneDigits(value) {
  return toEnglishDigits(value)
    .replace(/[^0-9]/g, "")
    .slice(0, PHONE_LENGTH);
}

// "" when the value is empty or a valid eleven-digit English number.
export function phoneError(value) {
  const raw = String(value ?? "").trim();
  if (raw === "") return "";
  if (toEnglishDigits(raw) !== raw)
    return "أدخل رقم الهاتف بالأرقام الإنجليزية فقط";
  return /^[0-9]{11}$/.test(raw) ? "" : "رقم الهاتف يتكون من 11 رقماً";
}
