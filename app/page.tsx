"use client";

import { useState } from "react";

export default function Home() {
  const [minutes, setMinutes] = useState(25);

  return (
    <main>
      <h1>{minutes}:00</h1>
      <button onClick={() => setMinutes(50)}>50 minutes</button>
      <button onClick={() => setMinutes(minutes + 1)}>+1 minute</button>
    </main>
  );
}