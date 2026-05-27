"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Listing = {
  id: number;
  title: string;
  price: string;
  image_url: string;
};

export default function BuyPage() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    async function loadListings() {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("id", { ascending: false });

      if (!error && data) {
        setListings(data);
      }
    }

    loadListings();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">
        Buy Products
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {listings.map((item) => (
          <div
            key={item.id}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
          >
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-52 object-cover"
            />

            <div className="p-5">
              <h2 className="text-2xl font-bold">
                {item.title}
              </h2>

              <p className="text-green-400 text-xl mt-2">
                ₹{item.price}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}