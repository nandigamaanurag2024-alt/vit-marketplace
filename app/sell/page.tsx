"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SellPage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async () => {
    try {
      if (!image) {
        alert("Please select an image");
        return;
      }

      // CLEAN FILE NAME
      const cleanName = image.name
        .replace(/\s/g, "-")
        .replace(/[^a-zA-Z0-9.-]/g, "");

      const fileName = `${Date.now()}-${cleanName}`;

      // UPLOAD IMAGE
      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(fileName, image);

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      // GET PUBLIC URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("listing-images")
        .getPublicUrl(fileName);

      // INSERT INTO DATABASE
      const { error } = await supabase.from("listings").insert([
        {
          title,
          phone,
          price,
          category,
          image_url: publicUrl,
          seller_email: "test@vitstudent.ac.in",
        },
      ]);

      if (error) {
        alert(error.message);
      } else {
        alert("Item listed successfully!");

        setTitle("");
        setPrice("");
        setCategory("");
        setImage(null);
      }
    } catch (err) {
      console.log(err);
      alert("Failed to fetch");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="bg-zinc-900 p-10 rounded-3xl w-full max-w-xl">
        <h1 className="text-5xl font-bold mb-8">
          Sell Item
        </h1>

        <input
          type="text"
          placeholder="Item Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
        />

        <input
          type="text"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
        />

        <input
          type="file"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setImage(e.target.files[0]);
            }
          }}
          className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
        />
<input
  type="text"
  placeholder="Phone Number"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
  className="w-full p-4 rounded-2xl bg-zinc-900 mb-4"
/>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-4 rounded-xl bg-zinc-800 mb-6"
        >
          <option value="">Select Category</option>
          <option value="Books">Books</option>
          <option value="Electronics">Electronics</option>
          <option value="Room Appliances">Room Appliances</option>
          <option value="Food/Snacks">Food/Snacks</option>
          <option value="Others">Others</option>
        </select>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 transition p-4 rounded-xl font-semibold"
        >
          List Item
        </button>
      </div>
    </main>
  );
}