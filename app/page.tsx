"use client";

import { useEffect, useState } from "react";

function format(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Home() {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (secondsLeft <= 0) setRunning(false);
  }, [secondsLeft]);

  return (
    <main style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
      <p>Flowmeter</p>
      <h1>{format(secondsLeft)}</h1>
      <button onClick={() => setRunning(!running)}>{running ? "Pause" : "Start"}</button>
      <button onClick={() => setSecondsLeft(50 * 60)}>50 minutes</button>
      <button onClick={() => setSecondsLeft(secondsLeft + 60)}>+1 minute</button>
      <button onClick={() => { setRunning(false); setSecondsLeft(25 * 60); }}>Reset</button>
    </main>
  );
}