let wordSet: Set<string> | null = null;
let loadPromise: Promise<Set<string>> | null = null;

export async function loadDictionary(): Promise<Set<string>> {
  if (wordSet) return wordSet;
  if (loadPromise) return loadPromise;

  loadPromise = fetch("/wordlist.txt")
    .then((r) => r.text())
    .then((text) => {
      wordSet = new Set(
        text
          .split("\n")
          .map((w) => w.trim().toUpperCase())
          .filter((w) => w.length >= 2)
      );
      return wordSet;
    });

  return loadPromise;
}

export function getDictionary(): Set<string> | null {
  return wordSet;
}

export function isValidWord(word: string, dictionary: Set<string>): boolean {
  return dictionary.has(word.toUpperCase());
}

/** Checks whether `word` can be formed using only the provided rack letters,
 *  consuming each letter at most as many times as it appears in the rack. */
export function canMakeWord(word: string, letters: string[]): boolean {
  const available = letters.map((l) => l.toUpperCase());
  for (const ch of word.toUpperCase()) {
    const idx = available.indexOf(ch);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

/** Returns all dictionary words that can be formed from the given rack. */
export function findPossibleWords(
  rack: string[],
  dictionary: Set<string>
): string[] {
  const results: string[] = [];
  for (const word of dictionary) {
    if (word.length >= 3 && canMakeWord(word, rack)) {
      results.push(word);
    }
  }
  return results;
}

/** True when the rack contains at least one valid word of `minLength` or longer. */
export function rackHasWordOfLength(
  rack: string[],
  dictionary: Set<string>,
  minLength: number
): boolean {
  for (const word of dictionary) {
    if (word.length >= minLength && canMakeWord(word, rack)) return true;
  }
  return false;
}
