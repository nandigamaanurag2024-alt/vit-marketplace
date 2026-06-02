"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<
    "email" | "password" | "confirm"
    | null
  >(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith("@vitstudent.ac.in")) {
      setMessage("Only @vitstudent.ac.in emails are allowed.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    } else {
      setMessage("Signup successful. Check your email verification link.");
      router.push("/login");
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create account</h1>
        <p style={styles.subtitle}>Sign up with your VIT student email.</p>

        <form onSubmit={handleSignup} style={styles.form}>
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
              autoComplete="new-password"
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

          <div style={styles.passwordWrap}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedField("confirm")}
              onBlur={() => setFocusedField(null)}
              autoComplete="new-password"
              style={{
                ...styles.input,
                ...styles.passwordInput,
                ...(focusedField === "confirm" ? styles.inputFocused : {}),
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              style={styles.toggleButton}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          {message ? <p style={styles.message}>{message}</p> : null}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link href="/login" style={styles.link}>
            Login
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
  message: {
    color: "#d4d4d8",
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