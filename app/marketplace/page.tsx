"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const WISHLIST_KEY = "vit-marketplace-wishlist";
const CATEGORIES = [
  "All",
  "Electronics",
  "Books",
  "Stationery",
  "Room Essentials",
  "Transport",
];

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  image_url: string | null;
  is_sold: boolean | null;
  tags: string[] | null;
  created_at: string;
};

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(WISHLIST_KEY);
    if (saved) {
      setFavorites(JSON.parse(saved));
    }

    async function loadProducts() {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();
      const { data, error: fetchError } = await supabase
        .from("products")
        .select(
          "id,title,description,price,category,location,image_url,is_sold,tags,created_at"
        )
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setProducts((data ?? []) as Product[]);
      setLoading(false);
    }

    void loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...products];

    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }

    if (activeCategory !== "All") {
      list = list.filter((p) => p.category === activeCategory);
    }

    list = list.filter((p) => p.price <= maxPrice);

    if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sortBy === "title-asc") list.sort((a, b) => a.title.localeCompare(b.title));

    return list;
  }, [activeCategory, maxPrice, search, sortBy]);

  function toggleFavorite(productId: string) {
    const updated = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];

    setFavorites(updated);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  }

  return (
    <main style={styles.page}>
      <div style={styles.glow} />
      <section style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <p style={styles.eyebrow}>VIT MARKETPLACE</p>
            <h1 style={styles.title}>Discover Products</h1>
            <p style={styles.subtitle}>
              Live search, smart filtering and modern product discovery for students.
            </p>
          </div>
          <Link href="/wishlist" style={styles.wishlistBtn}>
            Wishlist ({favorites.length})
          </Link>
        </div>

        <div style={styles.searchWrap}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, tags, category..."
            style={styles.searchInput}
          />
          {search ? (
            <button onClick={() => setSearch("")} style={styles.clearBtn}>
              Clear
            </button>
          ) : null}
        </div>

        <div style={styles.filterGrid}>
          <div style={styles.pillsWrap}>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                style={{
                  ...styles.pill,
                  ...(activeCategory === category ? styles.pillActive : {}),
                }}
              >
                {category}
              </button>
            ))}
          </div>

          <div style={styles.controls}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.select}
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="title-asc">A to Z</option>
            </select>

            <div style={styles.priceWrap}>
              <label style={styles.priceLabel}>Max Price: ₹{maxPrice}</label>
              <input
                type="range"
                min={100}
                max={5000}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={styles.priceSlider}
              />
            </div>
          </div>
        </div>

        <p style={styles.resultText}>
          {loading
            ? "Loading listings..."
            : error
            ? `Error: ${error}`
            : filtered.length === 0
            ? "No items found. Try another search or filter."
            : `${filtered.length} listing${filtered.length > 1 ? "s" : ""} found`}
        </p>

        {loading ? (
          <div style={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={styles.skeletonCard} />
            ))}
          </div>
        ) : error ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyEmoji}>⚠️</span>
            <h3 style={styles.emptyTitle}>Could not load listings</h3>
            <p style={styles.emptyText}>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyEmoji}>🛍️</span>
            <h3 style={styles.emptyTitle}>Nothing matched</h3>
            <p style={styles.emptyText}>
              Adjust your search query, category, sorting, or max price.
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                isFavorite={favorites.includes(product.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ProductCard({
  product,
  index,
  isFavorite,
  onToggleFavorite,
}: {
  product: Product;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <article style={{ ...styles.card, animationDelay: `${index * 60}ms` }}>
      <div style={styles.imageWrap}>
        <Link href={`/marketplace/${product.id}`} style={styles.imageLink}>
          <img
            src={product.image_url ?? "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=900&q=80"}
            alt={product.title}
            style={styles.image}
          />
          {product.is_sold ? <span style={styles.soldBadge}>SOLD</span> : null}
        </Link>

        <button
          onClick={() => onToggleFavorite(product.id)}
          style={{
            ...styles.heartButton,
            ...(isFavorite ? styles.heartButtonActive : {}),
          }}
          aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>

      <div style={styles.cardBody}>
        <p style={styles.category}>{product.category}</p>
        <Link href={`/marketplace/${product.id}`} style={styles.cardTitle}>
          {product.title}
        </Link>
        <p style={styles.cardDesc}>{product.description}</p>
        <div style={styles.cardFooter}>
          <span style={styles.price}>₹{product.price.toLocaleString()}</span>
          <span style={styles.meta}>{product.location}</span>
        </div>
      </div>
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "clamp(14px, 3.2vw, 24px) clamp(12px, 3vw, 16px) 80px",
    background: "#07070f",
    position: "relative",
    overflowX: "hidden",
  },
  glow: {
    position: "fixed",
    top: -120,
    left: "50%",
    transform: "translateX(-50%)",
    width: "920px",
    height: "360px",
    background:
      "radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "20px",
  },
  eyebrow: {
    fontSize: "11px",
    letterSpacing: "0.15em",
    color: "#67e8f9",
    textTransform: "uppercase",
    marginBottom: "8px",
    fontWeight: 700,
  },
  title: {
    margin: 0,
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(1.65rem, 7vw, 3.2rem)",
    lineHeight: 1.05,
    letterSpacing: "-0.03em",
    wordBreak: "break-word",
  },
  subtitle: {
    marginTop: "10px",
    color: "#9ca3af",
    maxWidth: "620px",
    lineHeight: 1.7,
    fontSize: "clamp(0.92rem, 2.8vw, 1rem)",
  },
  wishlistBtn: {
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.5)",
    color: "#c7d2fe",
    padding: "10px 14px",
    borderRadius: "10px",
    textDecoration: "none",
    fontWeight: 600,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    background: "rgba(15,15,26,0.9)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "14px",
    padding: "8px 10px",
    marginBottom: "14px",
  },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: "clamp(14px, 3.5vw, 15px)",
    padding: "8px",
    minWidth: 0,
  },
  clearBtn: {
    background: "rgba(255,255,255,0.06)",
    color: "#d4d4d8",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    padding: "7px 10px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
    marginBottom: "12px",
  },
  pillsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  pill: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#a1a1aa",
    borderRadius: "999px",
    padding: "7px 13px",
    fontSize: "13px",
    cursor: "pointer",
  },
  pillActive: {
    color: "#c7d2fe",
    borderColor: "rgba(99,102,241,0.6)",
    background: "rgba(99,102,241,0.2)",
  },
  controls: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
    gap: "10px",
  },
  select: {
    background: "rgba(15,15,26,0.95)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#d4d4d8",
    borderRadius: "10px",
    padding: "10px 12px",
    outline: "none",
  },
  priceWrap: {
    background: "rgba(15,15,26,0.9)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "10px 12px",
  },
  priceLabel: {
    display: "block",
    fontSize: "12px",
    marginBottom: "6px",
    color: "#9ca3af",
  },
  priceSlider: {
    width: "100%",
  },
  resultText: {
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: "14px",
  },
  card: {
    background: "linear-gradient(160deg, rgba(17,17,27,1) 0%, rgba(11,11,19,1) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
    animation: "fadeInUp 0.5s ease both",
    transition: "transform 220ms ease, box-shadow 220ms ease",
  },
  skeletonCard: {
    height: "300px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(90deg, rgba(26,26,36,0.7) 0%, rgba(40,40,54,0.9) 50%, rgba(26,26,36,0.7) 100%)",
    backgroundSize: "400px 100%",
    animation: "shimmer 1.25s linear infinite",
  },
  imageWrap: {
    position: "relative",
  },
  imageLink: {
    display: "block",
    textDecoration: "none",
  },
  image: {
    width: "100%",
    height: "180px",
    objectFit: "cover",
  },
  soldBadge: {
    position: "absolute",
    top: "12px",
    left: "12px",
    background: "rgba(239,68,68,0.85)",
    color: "#fff",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: 700,
  },
  heartButton: {
    position: "absolute",
    right: "10px",
    top: "10px",
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(12,12,20,0.86)",
    color: "#d4d4d8",
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 180ms ease",
  },
  heartButtonActive: {
    color: "#fb7185",
    borderColor: "rgba(251,113,133,0.6)",
    background: "rgba(251,113,133,0.14)",
    transform: "scale(1.04)",
  },
  cardBody: {
    padding: "12px",
  },
  category: {
    color: "#67e8f9",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    margin: "0 0 6px",
  },
  cardTitle: {
    display: "inline-block",
    color: "#f8fafc",
    textDecoration: "none",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "clamp(15px, 3.8vw, 16px)",
    marginBottom: "8px",
    wordBreak: "break-word",
  },
  cardDesc: {
    color: "#9ca3af",
    fontSize: "13px",
    lineHeight: 1.5,
    margin: 0,
    wordBreak: "break-word",
  },
  cardFooter: {
    marginTop: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  price: {
    color: "#c7d2fe",
    fontFamily: "'Syne', sans-serif",
    fontSize: "17px",
    fontWeight: 800,
  },
  meta: {
    color: "#6b7280",
    fontSize: "12px",
    minWidth: 0,
    wordBreak: "break-word",
  },
  emptyState: {
    textAlign: "center",
    padding: "70px 20px",
    border: "1px dashed rgba(255,255,255,0.15)",
    borderRadius: "14px",
    background: "rgba(15,15,26,0.7)",
  },
  emptyEmoji: {
    fontSize: "42px",
  },
  emptyTitle: {
    marginTop: "10px",
    marginBottom: "6px",
    fontFamily: "'Syne', sans-serif",
  },
  emptyText: {
    color: "#9ca3af",
  },
};