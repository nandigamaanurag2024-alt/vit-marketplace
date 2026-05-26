"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Listing = {
  id: number;
  title: string;
  price: string;
  category: string;
  image_url: string;
};

export default function MarketplacePage() {
  const [items, setItems] = useState<Listing[]>([]);

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

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-4xl font-bold mb-8">
        Marketplace
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item) => (
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
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}