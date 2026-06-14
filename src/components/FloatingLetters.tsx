"use client";

const TILES = [
  { letter: "S", top: "7%",  left: "6%",   fontSize: "5.5rem", anim: "float-tile-a", dur: "28s", delay: "0s"  },
  { letter: "P", top: "11%", left: "87%",  fontSize: "7rem",   anim: "float-tile-b", dur: "35s", delay: "5s"  },
  { letter: "E", top: "38%", left: "2%",   fontSize: "8rem",   anim: "float-tile-c", dur: "25s", delay: "9s"  },
  { letter: "L", top: "65%", left: "10%",  fontSize: "5rem",   anim: "float-tile-a", dur: "32s", delay: "3s"  },
  { letter: "L", top: "79%", left: "80%",  fontSize: "6.5rem", anim: "float-tile-b", dur: "38s", delay: "14s" },
  { letter: "F", top: "20%", left: "44%",  fontSize: "9rem",   anim: "float-tile-c", dur: "30s", delay: "7s"  },
  { letter: "A", top: "52%", left: "88%",  fontSize: "5.5rem", anim: "float-tile-a", dur: "27s", delay: "19s" },
  { letter: "W", top: "4%",  left: "36%",  fontSize: "5rem",   anim: "float-tile-b", dur: "33s", delay: "12s" },
  { letter: "R", top: "87%", left: "32%",  fontSize: "7.5rem", anim: "float-tile-c", dur: "36s", delay: "11s" },
  { letter: "T", top: "44%", left: "66%",  fontSize: "5.5rem", anim: "float-tile-a", dur: "29s", delay: "23s" },
];

export default function FloatingLetters() {
  return (
    <div
      aria-hidden="true"
      className="float-letters-root fixed inset-0 z-0 pointer-events-none overflow-hidden"
    >
      {TILES.map(({ letter, top, left, fontSize, anim, dur, delay }, i) => (
        <span
          key={i}
          className="absolute font-display font-black select-none leading-none"
          style={{
            top,
            left,
            fontSize,
            color: "var(--ink)",
            opacity: 0.045,
            filter: "blur(10px)",
            animationName: anim,
            animationDuration: dur,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: delay,
            willChange: "transform",
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
