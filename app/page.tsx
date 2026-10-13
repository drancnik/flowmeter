"use client";

import { useEffect, useState } from "react";

function format(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Home() {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const running = endsAt !== null;

  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) setEndsAt(null);
    };
    tick(); 
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  function startPause() {
    if (running) setEndsAt(null);
    else setEndsAt(Date.now() + secondsLeft * 1000);
  }

  function addMinute() {
    if (running) setEndsAt(endsAt + 60_000);
    else setSecondsLeft(secondsLeft + 60);
  }

  function setLength(minutes: number) {
    setEndsAt(null);
    setSecondsLeft(minutes * 60);
  }

  return (
    <main style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
      <p>Flowmeter</p>
      <h1>{format(secondsLeft)}</h1>
      <button onClick={startPause}>{running ? "Pause" : "Start"}</button>
      <button onClick={() => setLength("50")}>50 minutes</button>
      <button onClick={addMinute}>+1 minute</button>
      <button onClick={() => setLength(25)}>Reset</button>
    </main>
  );
}