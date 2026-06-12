"use client";

import { useEffect, useMemo, useRef, useState, KeyboardEvent } from "react";
import type { RoundState } from "@/engine/types";
import { canMakeWord } from "@/engine/dictionary";
import { getDictionary } from "@/engine/dictionary";
import { playTilePress, playWordAccepted, playWordRejected, unlock } from "@/lib/audio";
import Button from "./ui/Button";

interface Props {
  round: RoundState;
  onSubmit: (word: string) => void;
  wordsPlayedThisMatch: string[];
  privateLetters?: string[];
}

export default function WordInput({
  round,
  onSubmit,
  wordsPlayedThisMatch,
  privateLetters = [],
}: Props) {
  const [input, setInput]                     = useState("");
  const [flash, setFlash]                     = useState<"success" | "error" | null>(null);
  const [wordsThisRound, setWordsThisRound]   = useState<string[]>([]);
  const [pressedLetter, setPressedLetter]     = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInput("");
    setWordsThisRound([]);
    setFlash(null);
    // Only auto-focus on non-touch devices (mobile keyboard would cover the game)
    const isTouch = typeof window !== "undefined" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (!isTouch) inputRef.current?.focus();
  }, [round.roundNumber]);

  const fullRack = [...round.letters, ...privateLetters];

  // Track which rack position is consumed by the current typed word.
  // Algorithm: for each letter in the input, greedily consume a matching rack tile.
  // A tile is "used" if its slot has been claimed by the input.
  const tileConsumed = useMemo<boolean[]>(() => {
    const needed: Record<string, number> = {};
    for (const ch of input.toUpperCase()) {
      needed[ch] = (needed[ch] ?? 0) + 1;
    }
    // Walk the full rack; for each letter, consume one unit of need if available.
    const seen: Record<string, number> = {};
    return fullRack.map((letter) => {
      seen[letter] = (seen[letter] ?? 0) + 1;
      return seen[letter] <= (needed[letter] ?? 0);
    });
  }, [input, fullRack]);

  const validate = (word: string): string | null => {
    const w = word.toUpperCase().trim();
    if (w.length < 2) return "Too short";
    if (!canMakeWord(w, fullRack)) return "Can't make that";
    const dict = getDictionary();
    if (dict && !dict.has(w)) return "Not a word";
    if (wordsPlayedThisMatch.includes(w)) return "Already played";
    if (wordsThisRound.includes(w)) return "Used this round";
    return null;
  };

  const submit = () => {
    const w = input.toUpperCase().trim();
    if (!w) return;
    const err = validate(w);
    if (err) {
      playWordRejected();
      setFlash("error");
      setInput(""); // clear immediately so player types fresh
      setTimeout(() => setFlash(null), 500);
      return;
    }
    playWordAccepted();
    onSubmit(w);
    setWordsThisRound((prev) => [...prev, w]);
    setInput("");
    setFlash("success");
    setTimeout(() => setFlash(null), 350);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  const handleInputChange = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z]/g, "");
    if (cleaned.length > input.length) {
      playTilePress();
      const added = cleaned[cleaned.length - 1].toUpperCase();
      setPressedLetter(added);
      setTimeout(() => setPressedLetter(null), 100);
    }
    setInput(cleaned);
  };

  const tapTile = (letter: string, rackIndex: number) => {
    // Don't let the player tap a tile that's already consumed
    if (tileConsumed[rackIndex]) return;
    unlock();
    playTilePress();
    setPressedLetter(letter);
    setTimeout(() => setPressedLetter(null), 100);
    setInput((prev) => prev + letter.toLowerCase());
    const isTouch = typeof window !== "undefined" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (!isTouch) inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      {/* Letter rack */}
      <div className="flex gap-1.5 flex-wrap justify-center" style={{ perspective: "400px" }}>
        {round.letters.map((l, i) => {
          const consumed = tileConsumed[i];
          const isPressed = pressedLetter === l && !consumed;
          return (
            <button
              key={i}
              onClick={() => tapTile(l, i)}
              disabled={consumed}
              className={`w-11 h-11 flex items-center justify-center rounded-xl font-mono font-black text-xl select-none
                border shadow-sm transition-all duration-100 touch-manipulation
                ${consumed
                  ? "bg-arena-900 border-rim/40 text-ink-4 opacity-40 cursor-default"
                  : isPressed
                  ? "scale-90 bg-emerald-500/30 border-emerald-400 text-emerald-200 cursor-pointer"
                  : "bg-arena-800 border-rim-hi text-white hover:bg-arena-700 active:scale-90 cursor-pointer"
                }`}
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
            >
              {l}
            </button>
          );
        })}
        {privateLetters.map((l, i) => {
          const rackIdx = round.letters.length + i;
          const consumed = tileConsumed[rackIdx];
          return (
            <button
              key={`priv-${i}`}
              onClick={() => tapTile(l, rackIdx)}
              disabled={consumed}
              title="Private letter (Snipe)"
              className={`w-11 h-11 flex items-center justify-center rounded-xl font-mono font-black text-xl select-none
                border shadow-sm transition-all duration-100 cursor-pointer touch-manipulation
                ${consumed
                  ? "bg-amber-900/10 border-amber-400/20 text-amber-400/30 opacity-40 cursor-default"
                  : "bg-amber-500/20 border-amber-400/60 text-amber-300 hover:bg-amber-500/30 active:scale-90"
                }`}
            >
              {l}
            </button>
          );
        })}
      </div>

      {/* Input row */}
      <div className="flex gap-2 w-full">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={onKey}
          onFocus={() => unlock()}
          maxLength={fullRack.length}
          placeholder="type or tap letters…"
          inputMode="text"
          className={`flex-1 bg-arena-800 border rounded-xl px-4 py-3 text-white placeholder-ink-4
            text-base font-mono font-bold uppercase tracking-widest outline-none transition-colors min-w-0
            ${flash === "success"
              ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
              : flash === "error"
              ? "border-rose-400 bg-rose-500/15 animate-shake"
              : "border-rim focus:border-rim-hi"
            }`}
          autoComplete="off"
          spellCheck={false}
        />
        <Button
          variant="primary"
          size="md"
          className="px-5 touch-manipulation min-w-[56px] font-mono font-black"
          onClick={submit}
        >
          GO
        </Button>
      </div>

      {/* Words this round */}
      {wordsThisRound.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {wordsThisRound.map((w, i) => (
            <span
              key={i}
              className="bg-arena-800 text-emerald-300/70 text-xs font-mono px-2.5 py-1 rounded-lg uppercase tracking-wider border border-rim"
            >
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
