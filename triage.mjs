import { classify } from "./mock-ai.mjs";

export async function triage(text) {
  const controller = new AbortController();
  let timer;
  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error("Model timeout"));
      }, 300);
    });
    const result = JSON.parse(await Promise.race([
      classify(text, { signal: controller.signal }),
      timeout,
    ]));
    if (!result || !["delivery", "pricing", "other"].includes(result.topic)
      || typeof result.draft !== "string" || !result.draft.trim()) {
      throw new Error("Invalid model response");
    }
    return { status: "ready", topic: result.topic, draft: result.draft };
  } catch {
    return { status: "manual_review", topic: null, draft: null };
  } finally {
    clearTimeout(timer);
  }
}
