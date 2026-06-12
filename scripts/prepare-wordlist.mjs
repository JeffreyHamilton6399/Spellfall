import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");

const text = readFileSync(join(root, "public", "wordlist.txt"), "utf8");
const words = text
  .split("\n")
  .map((w) => w.trim().toUpperCase())
  .filter((w) => w.length >= 2);

mkdirSync(join(root, "party"), { recursive: true });

const out = `// Auto-generated from public/wordlist.txt — do not edit manually
// Run: node scripts/prepare-wordlist.mjs
export const WORD_SET = new Set<string>(${JSON.stringify(words)});
`;

writeFileSync(join(root, "party", "wordlist-data.ts"), out, "utf8");
console.log(`[prepare-wordlist] Wrote ${words.length} words → party/wordlist-data.ts`);
