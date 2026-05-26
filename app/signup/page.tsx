"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    if (!email.endsWith("@vitstudent.ac.in")) {
      alert("Only VIT emails allowed");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Signup successful!");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="bg-zinc-900 p-10 rounded-3xl w-full max-w-md">
        <h1 className="text-4xl font-bold mb-6">
          Sign Up
        </h1>

        <input
          type="email"
          placeholder="VIT Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-4 rounded-xl bg-zinc-800 mb-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 rounded-xl bg-zinc-800 mb-6"
        />

        <button
          onClick={handleSignup}
          className="w-full bg-blue-500 p-4 rounded-xl font-semibold"
        >
          Create Account
        </button>
      </div>
    </main>
  );
}