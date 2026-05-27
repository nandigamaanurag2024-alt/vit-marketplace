"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BuyPage() {
  const [listings, setListings] = useState<any[]>([]);

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setListings(data);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Buy Products</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {listings.map((item) => (
          <div
            key={item.id}
            className="bg-zinc-900 p-4 rounded-xl border border-zinc-800"
          >
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-52 object-cover rounded-lg mb-4"
            />

            <h2 className="text-2xl font-semibold">{item.title}</h2>

            <p className="text-zinc-400 mt-2">{item.description}</p>

            <p className="text-green-400 text-xl mt-4 font-bold">
              ₹{item.price}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}