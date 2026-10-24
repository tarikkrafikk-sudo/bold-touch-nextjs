import fs from "fs";
import path from "path";
import type { Realisation } from "@/data/realisations";

const DATA_FILE = path.join(process.cwd(), "data", "realisations.json");

function readFile(): Realisation[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Realisation[];
  } catch {
    return [];
  }
}

function writeFile(realisations: Realisation[]) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(realisations, null, 2), "utf-8");
}

export function getRealisations(): Realisation[] {
  return readFile();
}

export function addRealisation(realisation: Realisation): Realisation[] {
  const realisations = readFile();
  realisations.unshift(realisation);
  writeFile(realisations);
  return realisations;
}

export function deleteRealisation(id: string): Realisation[] {
  const realisations = readFile().filter((r) => r.id !== id);
  writeFile(realisations);
  return realisations;
}
