import assert from "node:assert/strict";
import { fillAndFlatten } from "./media_form_delivery.ts";

const result = fillAndFlatten({ assetId: "a1", pdfBase64: "cGRm", creatorEmail: "a@example.com", title: "Pilot" }, { episode: "1" });
assert.equal(result.flattened, true);
assert.equal(result.fields.episode, "1");
console.log("fillAndFlatten decision test passed");
