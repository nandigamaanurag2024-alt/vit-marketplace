import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">

      <section className="max-w-6xl mx-auto px-6 py-24">

        <div className="text-center">

          <p className="text-blue-500 font-semibold mb-4">
            Student Marketplace
          </p>

          <h1 className="text-7xl font-black leading-tight">
            Buy & Sell <br />
            Inside VIT
          </h1>

          <p className="text-zinc-400 text-xl mt-8 max-w-2xl mx-auto">
            Electronics, cycles, books, gaming gear,
            room essentials and more — directly from students.
          </p>

          <div className="flex gap-4 justify-center mt-10">

            <Link
              href="/marketplace"
              className="bg-blue-600 hover:bg-blue-500 transition px-8 py-4 rounded-2xl font-semibold text-lg"
            >
              Explore Marketplace
            </Link>

            <Link
              href="/sell"
              className="bg-zinc-900 border border-zinc-700 px-8 py-4 rounded-2xl font-semibold text-lg"
            >
              Sell Item
            </Link>

          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-24">

          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
            <h2 className="text-2xl font-bold">Books</h2>
            <p className="text-zinc-400 mt-3">
              Semester books, notes, guides and prep material.
            </p>
          </div>

          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
            <h2 className="text-2xl font-bold">Electronics</h2>
            <p className="text-zinc-400 mt-3">
              Monitors, keyboards, calculators and gadgets.
            </p>
          </div>

          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
            <h2 className="text-2xl font-bold">Hostel Essentials</h2>
            <p className="text-zinc-400 mt-3">
              Buckets, mattresses, tables, chairs and more.
            </p>
          </div>

        </div>

      </section>

    </main>
  );
}