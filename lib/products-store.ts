import fs from "fs";
import path from "path";
import type { Product } from "./products";

const DATA_FILE = path.join(process.cwd(), "data", "products.json");

function readFile(): Product[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Product[];
  } catch {
    return [];
  }
}

function writeFile(products: Product[]) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), "utf-8");
}

export function getProducts(): Product[] {
  return readFile();
}

export function addProduct(product: Product): Product[] {
  const products = readFile();
  products.unshift(product);
  writeFile(products);
  return products;
}

export function updateProduct(id: string, patch: Partial<Product>): Product[] {
  const products = readFile();
  const index = products.findIndex((p) => p.id === id);
  if (index !== -1) {
    products[index] = { ...products[index], ...patch, id: products[index].id };
    writeFile(products);
  }
  return products;
}

export function deleteProduct(id: string): Product[] {
  const products = readFile().filter((p) => p.id !== id);
  writeFile(products);
  return products;
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "produit"
  );
}
