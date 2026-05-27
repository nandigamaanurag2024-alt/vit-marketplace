import Link from "next/link";

const categories = [
  "Electronics",
  "Books",
  "Cycles",
  "Hostel Essentials",
  "Furniture",
  "Fashion",
  "Accessories",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold">VIT Marketplace</h1>

        <div className="flex gap-4">
          <Link
            href="/marketplace"
            className="bg-zinc-800 px-5 py-2 rounded-xl"
          >
            Browse
          </Link>

          <Link
            href="/sell"
            className="bg-blue-600 px-5 py-2 rounded-xl"
          >
            Sell
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="text-6xl font-bold leading-tight max-w-4xl">
          Buy & Sell Inside VIT
        </h1>

        <p className="text-zinc-400 text-xl mt-6 max-w-2xl">
          The student marketplace for electronics,
          books, cycles, hostel essentials and more.
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
      </section>

      {/* Categories */}
      <section className="px-8 pb-20">
        <h2 className="text-3xl font-bold mb-8">
          Popular Categories
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-blue-500 transition"
            >
              <h3 className="text-xl font-semibold">
                {category}
              </h3>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}