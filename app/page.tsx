"use client";

import { useEffect, useState } from "react";

type Block = { endedAt: number; minutes: number };

function format(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Home() {
  const [length, setLengthState] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const running = endsAt !== null;

  useEffect(() => {
    if (endsAt === null) return;
    const end = endsAt;
    const id = setInterval(tick, 250);
    function tick() {
      const left = Math.max(0, Math.round((end - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        clearInterval(id);
        setEndsAt(null);
        setBlocks((list) => [...list, { endedAt: Date.now(), minutes: length }]);
      }
    }
    tick();
    return () => clearInterval(id);
  }, [endsAt, length]);

  function startPause() {
    if (running) setEndsAt(null);
    else if (secondsLeft > 0) setEndsAt(Date.now() + secondsLeft * 1000);
  }

  function setLength(minutes: number) {
    setEndsAt(null);
    setLengthState(minutes);
    setSecondsLeft(Math.round(minutes * 60));
  }

  return (
    <main style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
      <p>Flowmeter</p>
      <h1>{format(secondsLeft)}</h1>
      <button onClick={startPause}>{running ? "Pause" : "Start"}</button>
      <button onClick={() => setLength(50)}>50 minutes</button>
      <button onClick={() => setLength(25)}>Reset</button>
      <button onClick={() => setLength(0.1)}>Test (6 seconds)</button>

      <h2>Today: {blocks.length} blocks</h2>
      <ul>
        {blocks.map((b) => (
          <li key={b.endedAt}>
            {b.minutes} min, finished at {new Date(b.endedAt).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </main>
  );
}