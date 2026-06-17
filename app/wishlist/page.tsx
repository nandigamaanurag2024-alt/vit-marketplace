"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const WISHLIST_KEY = "vit-marketplace-wishlist";

export default function WishlistPage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(WISHLIST_KEY);
    return saved ? (JSON.parse(saved) as string[]) : [];
  });
  const [products, setProducts] = useState<
    {
      id: string;
      title: string;
      price: number;
      image_url: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites(ids: string[]) {
      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("products")
        .select("id,title,price,image_url")
        .in("id", ids);

      setProducts((data ?? []) as { id: string; title: string; price: number; image_url: string | null }[]);
      setLoading(false);
    }

    void loadFavorites(favoriteIds);
  }, []);

  const favoriteProducts = useMemo(() => products, [products]);

  function removeFavorite(id: string) {
    const updated = favoriteIds.filter((x) => x !== id);
    setFavoriteIds(updated);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <main style={styles.page}>
      <section style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Your Wishlist</h1>
          <Link href="/marketplace" style={styles.backLink}>
            Back to Marketplace
          </Link>
        </div>

        {loading ? (
          <div style={styles.empty}>
            <p style={styles.emptyTitle}>Loading wishlist...</p>
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyTitle}>No favorites yet</p>
            <p style={styles.emptyText}>Tap the heart icon on products to save them here.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {favoriteProducts.map((product) => (
              <article key={product.id} style={styles.card}>
                <img
                  src={
                    product.image_url ??
                    "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=900&q=80"
                  }
                  alt={product.title}
                  style={styles.image}
                />
                <div style={styles.body}>
                  <p style={styles.name}>{product.title}</p>
                  <p style={styles.price}>₹{product.price.toLocaleString()}</p>
                  <div style={styles.actions}>
                    <Link href={`/marketplace/${product.id}`} style={styles.viewBtn}>
                      View
                    </Link>
                    <button onClick={() => removeFavorite(product.id)} style={styles.removeBtn}>
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#07070f",
    padding: "30px 16px 70px",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "10px",
  },
  title: {
    margin: 0,
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(2rem, 5vw, 2.9rem)",
  },
  backLink: {
    color: "#a5b4fc",
    textDecoration: "none",
  },
  empty: {
    border: "1px dashed rgba(255,255,255,0.18)",
    borderRadius: "14px",
    padding: "60px 18px",
    textAlign: "center",
    background: "rgba(15,15,26,0.7)",
  },
  emptyTitle: {
    margin: 0,
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.3rem",
  },
  emptyText: {
    color: "#9ca3af",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "12px",
  },
  card: {
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    overflow: "hidden",
    background: "rgba(15,15,26,0.9)",
  },
  image: {
    width: "100%",
    height: "170px",
    objectFit: "cover",
  },
  body: {
    padding: "10px",
  },
  name: {
    margin: 0,
    fontWeight: 600,
    lineHeight: 1.45,
  },
  price: {
    marginTop: "6px",
    marginBottom: "10px",
    color: "#c7d2fe",
    fontWeight: 700,
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  viewBtn: {
    background: "rgba(99,102,241,0.2)",
    border: "1px solid rgba(99,102,241,0.5)",
    color: "#c7d2fe",
    textDecoration: "none",
    textAlign: "center",
    borderRadius: "8px",
    padding: "8px",
  },
  removeBtn: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.5)",
    color: "#fda4af",
    borderRadius: "8px",
    padding: "8px",
  },
};
