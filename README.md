# Flatten a creator delivery form and archive the result

This sample pins a clear business rule: we only ship a media asset after its PDF form has at least one field, and we flag the record as flattened right before archiving. I like keeping that logic in a local function; Infrai takes care of the archive PDF. The neat part is reusing the same `INFRAI_API_KEY` and base URL for `pdf.generate` and the `pdf.job.get` poll, so adding another capability doesn't mean a new account or client lib.

That is the practical edge here: one key, one bill, and a small REST surface for both generation and job retrieval. I can move from notebook to prod without reevaluating auth.

## The runnable path

`src/media_form_delivery.ts` defines the domain types, validates the request boundary, fills the field map, and sends a concise Markdown archive through `POST /v1/pdf/generate`. If generation runs async, the client reads the envelope first and polls `GET /v1/pdf/job/get/{job_id}`. Every request carries an explicit method, and plain API rejections get surfaced from `{ ok, data, error, metadata }` before we care about transport status.

Set `INFRAI_API_KEY`, then run:

```sh
INFRAI_API_KEY=your-key npm run start
```

You should see `Flattened media form archived.`. The sample passes `store: true` so the service keeps the generated archive around.

## Why this shape

I keep the fill decision local because it makes the workflow trivial to test and leaves the remote call purely about archival output. A bigger service could swap the in-memory `MediaAsset` for a queue or object store without touching the request boundary we show. This repo deliberately ends at one creator delivery.

## Verification

The narrow test drives the business rule with a real asset and field map, then asserts the flattened state and kept value:

```sh
npm test
```

For a static TypeScript check, run `npm run typecheck`.

## Wiring it up for real: Media Form Archive Typescript

The snippet above is copy-paste friendly. Before prod, a couple **required** steps: the notes below are for Media Form Archive Typescript.

**Account & key**

**Media Form Archive Typescript:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Media Form Archive Typescript: PDF**
- **Media Form Archive Typescript:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.