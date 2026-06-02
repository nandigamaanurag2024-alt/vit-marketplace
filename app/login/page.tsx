"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(
    null
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorText(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorText("Please enter both email and password.");
      setLoading(false);
      return;
    }

    if (!cleanEmail.endsWith("@vitstudent.ac.in")) {
      setErrorText("Please login using your @vitstudent.ac.in email.");
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
    } else {
      const nextPath = searchParams.get("next");
      router.push(nextPath || "/marketplace");
      router.refresh();
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Login to list products and manage wishlist.</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="VIT Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            autoComplete="email"
            style={{
              ...styles.input,
              ...(focusedField === "email" ? styles.inputFocused : {}),
            }}
          />

          <div style={styles.passwordWrap}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              autoComplete="current-password"
              style={{
                ...styles.input,
                ...styles.passwordInput,
                ...(focusedField === "password" ? styles.inputFocused : {}),
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={styles.toggleButton}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {errorText ? <p style={styles.error}>{errorText}</p> : null}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={styles.footer}>
          New here?{" "}
          <Link href="/signup" style={styles.link}>
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#07070f",
  },
  card: {
    width: "100%",
    maxWidth: "430px",
    background: "rgba(15,15,26,0.95)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px",
    padding: "28px",
  },
  title: {
    margin: 0,
    fontFamily: "'Syne', sans-serif",
    fontSize: "2rem",
    color: "#f8fafc",
  },
  subtitle: {
    color: "#9ca3af",
    marginTop: "8px",
    marginBottom: "16px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    outline: "none",
    transition: "border-color 180ms ease, box-shadow 180ms ease",
  },
  inputFocused: {
    borderColor: "rgba(99,102,241,0.8)",
    boxShadow: "0 0 0 2px rgba(99,102,241,0.22)",
  },
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: "72px",
  },
  toggleButton: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "#e5e7eb",
    padding: "6px 10px",
    fontSize: "12px",
    cursor: "pointer",
  },
  button: {
    width: "100%",
    marginTop: "6px",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform 180ms ease, opacity 180ms ease, box-shadow 180ms ease",
    boxShadow: "0 8px 22px rgba(79,70,229,0.28)",
  },
  error: {
    color: "#fda4af",
    fontSize: "13px",
    marginBottom: "8px",
  },
  footer: {
    marginTop: "12px",
    color: "#9ca3af",
    fontSize: "14px",
  },
  link: {
    color: "#a5b4fc",
    textDecoration: "none",
  },
};