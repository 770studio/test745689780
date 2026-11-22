import test from "node:test";
import assert from "node:assert/strict";
import { triage } from "./triage.mjs";

for (const [text, topic] of [["доставка", "delivery"], ["цена", "pricing"], ["Здравствуйте", "other"]]) {
  test(`triage: ${topic}`, async () => {
    const result = await triage(text);
    assert.equal(result.status, "ready");
    assert.equal(result.topic, topic);
    assert.ok(result.draft.trim());
  });
}

for (const marker of ["timeout", "error", "bad-json", "bad-topic", "empty-draft"]) {
  test(`triage: ${marker} requires manual review`, async () => {
    const start = performance.now();
    assert.deepEqual(await triage(`[${marker}]`), {
      status: "manual_review", topic: null, draft: null,
    });
    // Allow scheduling overhead while rejecting the provider's 1200 ms delay.
    assert.ok(performance.now() - start < 1000);
  });
}
