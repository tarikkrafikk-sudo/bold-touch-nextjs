import fs from "fs";
import path from "path";
import { put, list } from "@vercel/blob";

export interface RequestPhoto {
  id: string;
  url: string;
  x: number;
  y: number;
  size: number;
}

export interface CustomRequest {
  id: string;
  productId: string;
  productName: string;
  color: string | null;
  size: string | null;
  qty: number;
  // Legacy single-photo field, kept for requests saved before multi-photo.
  photoUrl: string | null;
  uploadedPhotos?: RequestPhoto[];
  note: string;
  customText: string | null;
  selectedFont: string | null;
  textColor: string | null;
  textPosition: string | null;
  photoSize: number | null;
  textSize: number | null;
  createdAt: string;
}

// On Vercel, the deployment's filesystem is READ-ONLY outside of /tmp, and
// /tmp itself is wiped between cold starts and never shared across the
// multiple serverless instances a project can run concurrently. Writing
// orders to a local data/requests.json file (fs.writeFileSync) therefore
// silently loses data in production — an order submitted by a customer may
// never show up in /admin, or disappear a moment later. Vercel Blob is used
// instead as the actual store: it's a real persistent, shared location, and
// since the upload flow already requires BLOB_READ_WRITE_TOKEN for customer
// photos, no extra credential is needed here.
//
// Local development without a Blob token still works via the old
// file-based store, so `npm run dev` keeps working without any setup.
const BLOB_PATHNAME = "boldtouch/data/requests.json";
const DATA_FILE = path.join(process.cwd(), "data", "requests.json");

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function readLocalFile(): CustomRequest[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as CustomRequest[];
  } catch {
    return [];
  }
}

function writeLocalFile(requests: CustomRequest[]) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2), "utf-8");
}

async function readBlobStore(): Promise<CustomRequest[]> {
  try {
    // addRandomSuffix: false (used on write) makes the pathname
    // deterministic, but we still need the per-project blob base URL, so we
    // look it up via list() rather than guessing it.
    const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
    const blob = blobs.find((b) => b.pathname === BLOB_PATHNAME);
    if (!blob) return [];
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as CustomRequest[]) : [];
  } catch (err) {
    console.error("requests-store: failed to read from Vercel Blob:", err);
    return [];
  }
}

async function writeBlobStore(requests: CustomRequest[]) {
  await put(BLOB_PATHNAME, JSON.stringify(requests, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function readAll(): Promise<CustomRequest[]> {
  if (hasBlobToken()) return readBlobStore();
  return readLocalFile();
}

async function writeAll(requests: CustomRequest[]) {
  if (hasBlobToken()) {
    await writeBlobStore(requests);
    return;
  }
  writeLocalFile(requests);
}

export async function getRequests(): Promise<CustomRequest[]> {
  const requests = await readAll();
  return requests.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function addRequest(request: CustomRequest): Promise<CustomRequest[]> {
  const requests = await readAll();
  requests.unshift(request);
  await writeAll(requests);
  return getRequests();
}

export async function deleteRequest(id: string): Promise<CustomRequest[]> {
  const requests = (await readAll()).filter((r) => r.id !== id);
  await writeAll(requests);
  return getRequests();
}
