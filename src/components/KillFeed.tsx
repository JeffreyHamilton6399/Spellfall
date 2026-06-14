"use client";

import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Swords, Zap } from "lucide-react";
import type { KillEvent, AbilityEvent } from "@/engine/types";
import { ABILITIES } from "@/engine/abilities";
import { useSettings } from "@/contexts/SettingsContext";
import AbilityIcon from "./AbilityIcon";

type FeedItem =
  | { kind: "kill";    ev: KillEvent;    id: number; addedAt: number }
  | { kind: "ability"; ev: AbilityEvent; id: number; addedAt: number };

interface Props {
  killFeed: KillEvent[];
  abilityFeed?: AbilityEvent[];
}

const MAX_VISIBLE = 5;
let itemId = 0;

function KillFeedInner({ killFeed, abilityFeed = [] }: Props) {
  const { settings } = useSettings();
  const [visible, setVisible] = useState<FeedItem[]>([]);
  const killLenRef    = useRef(0);
  const abilityLenRef = useRef(0);

  // Auto-dismiss expired items every second
  useEffect(() => {
    const id = setInterval(() => {
      setVisible((prev) => prev.filter((item) => Date.now() - item.addedAt < 5000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const now = Date.now();
    const newItems: FeedItem[] = [];

    if (killFeed.length > killLenRef.current) {
      killFeed.slice(killLenRef.current).forEach((ev) =>
        newItems.push({ kind: "kill", ev, id: ++itemId, addedAt: now })
      );
      killLenRef.current = killFeed.length;
    }

    if (abilityFeed.length > abilityLenRef.current) {
      abilityFeed.slice(abilityLenRef.current).forEach((ev) =>
        newItems.push({ kind: "ability", ev, id: ++itemId, addedAt: now })
      );
      abilityLenRef.current = abilityFeed.length;
    }

    if (newItems.length > 0) {
      setVisible((prev) => [...prev, ...newItems].slice(-MAX_VISIBLE));
    }
  }, [killFeed, abilityFeed]);

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 pointer-events-none">
      <AnimatePresence initial={false}>
        {visible.map((item) => (
          <motion.div
            key={item.id}
            initial={settings.reducedMotion ? {} : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={settings.reducedMotion ? {} : { opacity: 0, x: -10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex items-center gap-2 bg-black/70 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 backdrop-blur-sm max-w-xs"
          >
            {item.kind === "kill" ? (
              <>
                <Swords size={12} className="text-rose-400 flex-shrink-0" />
                {item.ev.killerId ? (
                  <span>
                    <span className="text-emerald-400 font-semibold">{item.ev.killerName}</span>
                    <span className="text-slate-500 mx-1">→</span>
                    <span className="text-rose-400 font-semibold">{item.ev.killedName}</span>
                  </span>
                ) : (
                  <span>
                    <span className="text-rose-400 font-semibold">{item.ev.killedName}</span>
                    <span className="text-slate-500 ml-1">zone'd</span>
                  </span>
                )}
              </>
            ) : (
              <>
                <Zap size={12} className="text-amber-400 flex-shrink-0" />
                <span>
                  <span className="text-amber-300 font-semibold">{item.ev.playerName}</span>
                  <span className="text-slate-500 mx-1">used</span>
                  <span className="text-white font-semibold flex items-center gap-1">
                    {ABILITIES[item.ev.abilityId]?.icon && (
                      <AbilityIcon name={ABILITIES[item.ev.abilityId].icon} size={10} />
                    )}
                    {item.ev.abilityName}
                  </span>
                  {item.ev.targetName && (
                    <>
                      <span className="text-slate-500 mx-1">on</span>
                      <span className="text-sky-300 font-semibold">{item.ev.targetName}</span>
                    </>
                  )}
                </span>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const KillFeed = memo(KillFeedInner, (prev, next) =>
  prev.killFeed.length === next.killFeed.length &&
  (prev.abilityFeed?.length ?? 0) === (next.abilityFeed?.length ?? 0)
);

export default KillFeed;
