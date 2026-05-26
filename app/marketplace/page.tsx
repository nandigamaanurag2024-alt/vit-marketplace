"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Listing = {
  id: number;
  title: string;
  price: string;
  category: string;
  image_url: string;
  phone: string;
};

export default function MarketplacePage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [selectedCategory, setSelectedCategory] =
  useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log(error);
    } else {
      setItems(data || []);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-4xl font-bold mb-8">
        Marketplace
      </h1>
      <input
  type="text"
  placeholder="Search items..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="w-full mb-6 p-4 rounded-2xl bg-zinc-900 text-white"
/>
      <div className="flex gap-4 mb-8 flex-wrap">
  {[
    "All",
    "Books",
    "Electronics",
    "Room Appliances",
    "Food/Snacks",
    "Others",
  ].map((category) => (
    <button
      key={category}
      onClick={() => setSelectedCategory(category)}
      className={`px-5 py-2 rounded-xl ${
        selectedCategory === category
          ? "bg-blue-600"
          : "bg-zinc-800"
      }`}
    >
      {category}
    </button>
  ))}
</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items
  .filter((item) => {
    const matchesCategory =
      selectedCategory === "All"
        ? true
        : item.category === selectedCategory;
  
    const matchesSearch =
      item.title
        .toLowerCase()
        .includes(search.toLowerCase());
  
    return matchesCategory && matchesSearch;
  })
  .map((item) => (
          <div
            key={item.id}
            className="bg-zinc-900 rounded-3xl overflow-hidden"
          >
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-64 object-cover"
            />

            <div className="p-5">
              <h2 className="text-2xl font-bold">
                {item.title}
              </h2>

              <p className="text-zinc-400 mt-2">
                {item.category}
              </p>

              <p className="text-blue-400 text-xl mt-4 font-semibold">
  ₹{item.price}
</p>

<a
  href={`https://wa.me/${item.phone}`}
  target="_blank"
  className="block mt-4 bg-green-600 text-center py-3 rounded-xl font-semibold"
>
  Contact Seller
</a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}