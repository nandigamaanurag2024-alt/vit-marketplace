import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center max-w-3xl">
        <h1 className="text-6xl font-bold leading-tight">
          Buy & Sell Inside VIT
        </h1>

        <p className="text-zinc-400 text-xl mt-6">
          The student marketplace for electronics,
          books, cycles, hostels essentials and more.
        </p>

        <div className="flex gap-4 justify-center mt-10">
          <Link
            href="/marketplace"
            className="bg-blue-600 px-8 py-4 rounded-2xl font-semibold"
          >
            Browse Items
          </Link>

          <Link
            href="/sell"
            className="bg-zinc-800 px-8 py-4 rounded-2xl font-semibold"
          >
            Sell Something
          </Link>
        </div>
      </div>
    </main>
  );
}