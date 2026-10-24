import fs from "fs";
import path from "path";

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

const DATA_FILE = path.join(process.cwd(), "data", "reviews.json");

function readFile(): Review[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Review[];
  } catch {
    return [];
  }
}

function writeFile(reviews: Review[]) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(reviews, null, 2), "utf-8");
}

export function getReviews(): Review[] {
  return readFile().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getApprovedReviews(): Review[] {
  return getReviews().filter((r) => r.status === "approved");
}

export function addReview(review: Review): Review[] {
  const reviews = readFile();
  reviews.unshift(review);
  writeFile(reviews);
  return getReviews();
}

export function setReviewStatus(id: string, status: ReviewStatus): Review[] {
  const reviews = readFile();
  const index = reviews.findIndex((r) => r.id === id);
  if (index !== -1) {
    reviews[index].status = status;
    writeFile(reviews);
  }
  return getReviews();
}

export function deleteReview(id: string): Review[] {
  const reviews = readFile().filter((r) => r.id !== id);
  writeFile(reviews);
  return getReviews();
}
