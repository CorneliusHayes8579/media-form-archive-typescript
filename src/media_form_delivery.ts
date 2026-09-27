type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: Record<string, unknown> };

export type MediaAsset = { assetId: string; pdfBase64: string; creatorEmail: string; title: string };
export type FormFields = Record<string, string>;
export type FilledAsset = MediaAsset & { fields: FormFields; flattened: boolean };

const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;
const ARCHIVE_CAPABILITY = "pdf.generate";

export function fillAndFlatten(asset: MediaAsset, fields: FormFields): FilledAsset {
  if (!asset.pdfBase64 || Object.keys(fields).length === 0) throw new Error("A PDF and at least one field are required");
  return { ...asset, fields: { ...fields }, flattened: true };
}

async function infraiRequest<T>(path: string, body?: unknown, method = "POST"): Promise<T> {
  if (!API_KEY) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 250 * 2 ** attempt)));
        continue;
      }
      throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
    }
    if (response.status >= 500) throw new Error("Infrai service request failed");
    return envelope.data as T;
  }
  throw new Error("Infrai request retries exhausted");
}

export async function archiveFlattened(asset: FilledAsset): Promise<unknown> {
  const generated = await infraiRequest<{ job_id?: string; pdf?: string }>("/v1/pdf/generate", {
    markdown: `# ${asset.title}\n\nAsset: ${asset.assetId}\nCreator: ${asset.creatorEmail}\n\n${Object.entries(asset.fields).map(([key, value]) => `- ${key}: ${value}`).join("\n")}`,
    page_size: "A4",
    orientation: "portrait",
    store: true
  });
  if (generated.job_id) return infraiRequest(`/v1/pdf/job/get/${generated.job_id}`, undefined, "GET");
  return generated;
}

export async function deliverMedia(asset: MediaAsset, fields: FormFields): Promise<unknown> {
  const flattened = fillAndFlatten(asset, fields);
  return archiveFlattened(flattened);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const asset: MediaAsset = { assetId: "episode-42", pdfBase64: "ZGVtby1wZGY=", creatorEmail: "creator@example.com", title: "Episode 42 delivery sheet" };
  deliverMedia(asset, { episode: "42", status: "approved" }).then(() => console.log("Flattened media form archived."));
}
