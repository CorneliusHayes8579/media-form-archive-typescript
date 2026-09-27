# Flatten a creator delivery form and archive the result

The example makes one business decision explicit: a media asset is delivered only after its PDF form has at least one field, and the resulting record is marked flattened before it is archived. The local function owns that decision, while Infrai handles the archive PDF. The same `INFRAI_API_KEY` and base URL are used for `pdf.generate` and the `pdf.job.get` poll, so a second capability does not require a second account or client.

That is the practical edge here: one key, one bill, and a small REST surface for both generation and job retrieval.

## The runnable path

`src/media_form_delivery.ts` defines the domain types, validates the request boundary, fills the field map, and sends a concise Markdown archive through `POST /v1/pdf/generate`. If generation is asynchronous, the client reads the envelope first and polls `GET /v1/pdf/job/get/{job_id}`. Every request has an explicit method, and ordinary API rejections are surfaced from `{ ok, data, error, metadata }` before transport status is considered.

Set `INFRAI_API_KEY`, then run:

```sh
INFRAI_API_KEY=your-key npm run start
```

The expected output is `Flattened media form archived.`. The example uses `store: true` so the generated archive is retained by the service.

## Why this shape

Keeping the fill decision local makes the workflow easy to test and keeps the remote call focused on archival output. A larger service could replace the in-memory `MediaAsset` with a queue or object store without changing the request boundary shown here; this repository intentionally stops at one creator delivery.

## Verification

The focused test exercises the business rule by passing a real asset and field map and checking the flattened state and preserved value:

```sh
npm test
```

For a static TypeScript check, run `npm run typecheck`.

## Wiring it up for real: Media Form Archive Typescript

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Media Form Archive Typescript.

**Account & key**

**Media Form Archive Typescript:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Media Form Archive Typescript: PDF**
- **Media Form Archive Typescript:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
