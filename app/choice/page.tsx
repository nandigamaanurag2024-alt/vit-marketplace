"use client";

import { useRouter } from "next/navigation";

export default function ChoicePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-5xl font-bold mb-12">
        What do you want to do?
      </h1>

      <div className="flex gap-8">
        <button
          onClick={() => router.push("/marketplace")}
          className="bg-white text-black px-10 py-6 rounded-3xl text-2xl font-bold hover:scale-105 transition"
        >
          Buy
        </button>

        <button
          onClick={() => router.push("/sell")}
          className="bg-blue-500 px-10 py-6 rounded-3xl text-2xl font-bold hover:scale-105 transition"
        >
          Sell
        </button>
      </div>
    </main>
  );
}