"use client";

import { useState } from "react";

export default function Home() {
  const [minutes, setMinutes] = useState(25);

  return (
    <main>
      <p>Flowmeter</p>
      <h1>{minutes}:00</h1>
      <button onClick={() => setMinutes(50)}>50 minutes</button>
      <button onClick={() => setMinutes(minutes + 1)}>+1 minute</button>
      <button onClick={() => setMinutes(25)}>Reset</button>
    </main>
  );
}