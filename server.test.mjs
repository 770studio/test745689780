import test, { after } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";

process.env.PORT = "0";
const { server } = await import("./server.mjs");
if (!server.listening) await once(server, "listening");
after(() => new Promise((resolve, reject) => {
  server.close((error) => error ? reject(error) : resolve());
}));
const base = `http://127.0.0.1:${server.address().port}`;

for (const body of ["{", "", "null", "[]", "{}", '{"text":null}', '{"text":42}', '{"text":false}', '{"text":[]}', '{"text":{}}', '{"text":""}', '{"text":"  \\n "}']) {
  test(`HTTP rejects ${JSON.stringify(body)}`, async () => {
    const reply = await fetch(`${base}/api/triage`, { method: "POST", body });
    assert.equal(reply.status, 400);
    assert.deepEqual(await reply.json(), { status: "invalid_input" });
  });
}

for (const text of ["доставка", "цена", "привет", "[timeout]", "[error]", "[bad-json]", "[bad-topic]", "[empty-draft]"]) {
  test(`HTTP handles ${text}`, async () => {
    const reply = await fetch(`${base}/api/triage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    assert.equal(reply.status, 200);
    const result = await reply.json();
    if (text.startsWith("[")) {
      assert.deepEqual(result, { status: "manual_review", topic: null, draft: null });
    } else {
      assert.deepEqual(result, {
        status: "ready", topic: { доставка: "delivery", цена: "pricing", привет: "other" }[text],
        draft: "Спасибо за обращение. Уточним детали заявки.",
      });
    }
  });
}
