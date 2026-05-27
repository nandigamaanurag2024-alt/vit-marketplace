"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Listing = {
  id: number;
  title: string;
  price: string;
  category: string;
  image_url: string;
};

const categories = [
  "All",
  "Books",
  "Food",
  "Electronics",
  "Room Appliances",
  "Others",
];

export default function MarketplacePage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setItems(data);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter(
          (item) => item.category === selectedCategory
        );

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-5xl font-bold mb-8">
        Marketplace
      </h1>

      <div className="flex gap-4 flex-wrap mb-10">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() =>
              setSelectedCategory(category)
            }
            className={`px-5 py-3 rounded-xl transition ${
              selectedCategory === category
                ? "bg-blue-600"
                : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800"
          >
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-52 object-cover rounded-xl mb-4"
            />

            <h2 className="text-2xl font-bold">
              {item.title}
            </h2>

            <p className="text-zinc-400 mt-2">
              {item.category}
            </p>

            <p className="text-green-400 text-2xl font-bold mt-4">
              ₹{item.price}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}