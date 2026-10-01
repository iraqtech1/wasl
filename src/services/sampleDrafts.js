import { createDemoData } from "./demoData.js";

// Seed device drafts once; consumed or deleted examples must not return.
export function readDeviceDrafts(user, storage = globalThis.localStorage) {
  const key = "wasel-offline-" + user.id;
  const marker = key + "-samples-oct-1";
  const drafts = JSON.parse(storage.getItem(key) || "[]");
  if (!Array.isArray(drafts)) return [];
  let changed = false;
  for (const draft of drafts) {
    if (!draft.localDraftId) { draft.localDraftId = crypto.randomUUID(); changed = true; }
  }
  if (changed) storage.setItem(key, JSON.stringify(drafts));
  if (user.id !== "MER-DEMO" || storage.getItem(marker)) return drafts;
  const samples = createDemoData().orders
    .filter(o => o.id.startsWith("ORD-SAMPLE-OCT-") && o.status === "draft")
    .slice(0, 10)
    .map(o => {
      const { id, merchant, courier, status, history, handoverCode, createdAt, updatedAt, publishedAt, ...draft } = o;
      return { ...draft, publish: false, sampleDraftId: id, localDraftId: crypto.randomUUID() };
    });
  const known = new Set(drafts.map(d => d.sampleDraftId));
  const merged = [...drafts, ...samples.filter(d => !known.has(d.sampleDraftId))];
  storage.setItem(key, JSON.stringify(merged));
  storage.setItem(marker, "1");
  return merged;
}
