import fs from "fs";
import path from "path";
import { put, list } from "@vercel/blob";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  productName: string | null;
  status: ReviewStatus;
  createdAt: string;
}

// On Vercel, the deployment's filesystem is READ-ONLY outside of /tmp, and
// /tmp itself is wiped between cold starts and never shared across the
// multiple serverless instances a project can run concurrently. Writing
// reviews to a local data/reviews.json file (fs.writeFileSync) therefore
// throws in production — a customer submitting a review gets "Connexion
// impossible." because the server crashes instead of returning JSON. Vercel
// Blob is used instead as the actual store, same as requests-store.ts.
//
// Local development without a Blob token still works via the old
// file-based store, so `npm run dev` keeps working without any setup.
const BLOB_PATHNAME = "boldtouch/data/reviews.json";
const DATA_FILE = path.join(process.cwd(), "data", "reviews.json");

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function readLocalFile(): Review[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Review[];
  } catch {
    return [];
  }
}

function writeLocalFile(reviews: Review[]) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(reviews, null, 2), "utf-8");
}

async function readBlobStore(): Promise<Review[]> {
  try {
    const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
    const blob = blobs.find((b) => b.pathname === BLOB_PATHNAME);
    if (!blob) return [];
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as Review[]) : [];
  } catch (err) {
    console.error("reviews-store: failed to read from Vercel Blob:", err);
    return [];
  }
}

async function writeBlobStore(reviews: Review[]) {
  await put(BLOB_PATHNAME, JSON.stringify(reviews, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function readAll(): Promise<Review[]> {
  if (hasBlobToken()) return readBlobStore();
  return readLocalFile();
}

async function writeAll(reviews: Review[]) {
  if (hasBlobToken()) {
    await writeBlobStore(reviews);
    return;
  }
  writeLocalFile(reviews);
}

export async function getReviews(): Promise<Review[]> {
  const reviews = await readAll();
  return reviews.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getApprovedReviews(): Promise<Review[]> {
  const reviews = await getReviews();
  return reviews.filter((r) => r.status === "approved");
}

export async function addReview(review: Review): Promise<Review[]> {
  const reviews = await readAll();
  reviews.unshift(review);
  await writeAll(reviews);
  return getReviews();
}

export async function setReviewStatus(id: string, status: ReviewStatus): Promise<Review[]> {
  const reviews = await readAll();
  const index = reviews.findIndex((r) => r.id === id);
  if (index !== -1) {
    reviews[index].status = status;
    await writeAll(reviews);
  }
  return getReviews();
}

export async function deleteReview(id: string): Promise<Review[]> {
  const reviews = (await readAll()).filter((r) => r.id !== id);
  await writeAll(reviews);
  return getReviews();
}
