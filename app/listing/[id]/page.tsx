"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

type Listing = {
  id: number;
  title: string;
  price: string;
  image_url: string;
  category: string;
  description: string;
};

export default function ListingPage() {
  const params = useParams();

  const [item, setItem] = useState<Listing | null>(
    null
  );

  useEffect(() => {
    async function fetchItem() {
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("id", params.id)
        .single();

      if (data) {
        setItem(data);
      }
    }

    fetchItem();
  }, [params.id]);

  if (!item) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">

        <img
          src={
            item.image_url ||
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff"
          }
          alt={item.title}
          className="w-full rounded-3xl object-cover"
        />

        <div>

          <p className="text-blue-400 text-lg">
            {item.category}
          </p>

          <h1 className="text-6xl font-black mt-4">
            {item.title}
          </h1>

          <p className="text-green-400 text-4xl font-bold mt-6">
            ₹{item.price}
          </p>

          <p className="text-zinc-400 text-lg mt-8 leading-relaxed">
            {item.description ||
              "No description provided."}
          </p>

          <button className="w-full mt-10 bg-blue-600 hover:bg-blue-500 transition py-5 rounded-2xl text-xl font-bold">
            Contact Seller
          </button>

        </div>

      </div>

    </main>
  );
}