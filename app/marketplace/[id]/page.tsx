"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const WISHLIST_KEY = "vit-marketplace-wishlist";

type Product = {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  seller_name: string;
  seller_avatar: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  description: string;
  location: string;
  created_at: string;
  whatsapp: string;
  is_sold: boolean | null;
};

export default function ProductPage() {
  const params = useParams();

  const rawId = params?.id;
  const id = Array.isArray(rawId)
    ? rawId[0]
    : rawId ?? "";

  const [activeImage, setActiveImage] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(WISHLIST_KEY);
    if (saved) setFavoriteIds(JSON.parse(saved));

    async function loadProduct() {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();
      const { data, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (productError) {
        setError(productError.message);
        setLoading(false);
        return;
      }

      setProduct(data as Product);

      const { data: relatedData } = await supabase
        .from("products")
        .select("*")
        .eq("category", data.category)
        .neq("id", data.id)
        .limit(3);

      setRelatedProducts((relatedData ?? []) as Product[]);
      setLoading(false);
    }

    if (id) {
      void loadProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingCard}>Loading product...</div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <h1>Product Not Found</h1>

        <Link
          href="/marketplace"
          style={{
            background: "#2563eb",
            padding: "14px 24px",
            borderRadius: "12px",
            color: "white",
            textDecoration: "none",
          }}
        >
          Back to Marketplace
        </Link>
      </main>
    );
  }

  const currentProduct = product;
  const galleryImages =
    currentProduct.image_urls && currentProduct.image_urls.length > 0
      ? currentProduct.image_urls
      : [
          currentProduct.image_url ??
            "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=900&q=80",
        ];

  const isFavorite = favoriteIds.includes(currentProduct.id);
  const selectedImage =
    galleryImages[activeImage] ?? galleryImages[0];

  function toggleFavorite() {
    const updated = isFavorite
      ? favoriteIds.filter((x) => x !== currentProduct.id)
      : [...favoriteIds, currentProduct.id];

    setFavoriteIds(updated);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  }

  async function shareListing() {
    const shareText = `Check this item on VIT Marketplace: ${currentProduct.title}`;
    if (navigator.share) {
      await navigator.share({
        title: currentProduct.title,
        text: shareText,
        url: window.location.href,
      });
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    alert("Listing link copied to clipboard");
  }

  return (
    <main style={styles.page}>
      <div style={styles.glow} />
      <div style={styles.container}>
        <section style={styles.productGrid}>
          <div style={styles.galleryWrap}>
            <img
              src={selectedImage}
              alt={currentProduct.title}
              style={styles.heroImage}
            />
            <div style={styles.thumbRow}>
              {galleryImages.map((image, i) => (
                <button
                  key={image}
                  onClick={() => setActiveImage(i)}
                  style={{
                    ...styles.thumbButton,
                    ...(activeImage === i ? styles.thumbButtonActive : {}),
                  }}
                >
                  <img
                    src={image}
                    alt={`${currentProduct.title} ${i + 1}`}
                    style={styles.thumbImage}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={styles.category}>{currentProduct.category}</p>
            <h1 style={styles.title}>{currentProduct.title}</h1>
            <p style={styles.price}>₹{currentProduct.price.toLocaleString()}</p>

            <div style={styles.chips}>
              <span style={styles.chip}>{currentProduct.condition}</span>
              <span style={styles.chip}>📍 {currentProduct.location}</span>
              <span style={styles.chip}>
                {new Date(currentProduct.created_at).toLocaleDateString()}
              </span>
            </div>

            <p style={styles.desc}>{currentProduct.description}</p>

            <div style={styles.sellerCard}>
              <div style={styles.avatar}>
                {currentProduct.seller_avatar?.charAt(0) ??
                  currentProduct.seller_name.charAt(0)}
              </div>
              <div>
                <p style={styles.sellerLabel}>Seller</p>
                <h3 style={styles.sellerName}>{currentProduct.seller_name}</h3>
              </div>
            </div>

            <div style={styles.actions}>
              <a
                href={`https://wa.me/91${currentProduct.whatsapp}`}
                target="_blank"
                style={styles.whatsappBtn}
              >
                Chat on WhatsApp
              </a>
              <button onClick={shareListing} style={styles.secondaryBtn}>
                Share
              </button>
              <button onClick={toggleFavorite} style={styles.secondaryBtn}>
                {isFavorite ? "♥ Wishlisted" : "♡ Add to Wishlist"}
              </button>
            </div>
          </div>
        </section>

        <section style={styles.relatedSection}>
          <div style={styles.relatedHeader}>
            <h2 style={styles.relatedTitle}>Related Products</h2>
            <Link href="/marketplace" style={styles.backLink}>
              View all
            </Link>
          </div>

          <div style={styles.relatedGrid}>
            {relatedProducts.map((item) => (
              <Link key={item.id} href={`/marketplace/${item.id}`} style={styles.relatedCard}>
                <img
                  src={
                    item.image_url ??
                    "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=900&q=80"
                  }
                  alt={item.title}
                  style={styles.relatedImage}
                />
                <div style={styles.relatedBody}>
                  <p style={styles.relatedName}>{item.title}</p>
                  <p style={styles.relatedPrice}>₹{item.price.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#07070f",
    padding: "clamp(14px, 3.2vw, 30px) clamp(12px, 3vw, 16px) 80px",
    position: "relative",
    overflowX: "hidden",
  },
  glow: {
    position: "fixed",
    top: -120,
    left: "50%",
    transform: "translateX(-50%)",
    width: "900px",
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
  loadingCard: {
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "40px",
    textAlign: "center",
    background: "rgba(15,15,26,0.8)",
    color: "#d4d4d8",
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
    gap: "clamp(14px, 3vw, 26px)",
    alignItems: "start",
  },
  galleryWrap: {
    animation: "fadeInUp 0.45s ease both",
  },
  heroImage: {
    width: "100%",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.1)",
    objectFit: "cover",
    height: "clamp(230px, 52vw, 360px)",
  },
  thumbRow: {
    marginTop: "10px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(64px, 1fr))",
    gap: "8px",
  },
  thumbButton: {
    padding: 0,
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    overflow: "hidden",
    background: "transparent",
    cursor: "pointer",
  },
  thumbButtonActive: {
    borderColor: "rgba(99,102,241,0.75)",
    boxShadow: "0 0 0 2px rgba(99,102,241,0.25)",
  },
  thumbImage: {
    width: "100%",
    height: "74px",
    objectFit: "cover",
    display: "block",
  },
  category: {
    color: "#67e8f9",
    marginBottom: "8px",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 700,
  },
  title: {
    margin: 0,
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(1.6rem, 7vw, 3.2rem)",
    lineHeight: 1.02,
    letterSpacing: "-0.02em",
    wordBreak: "break-word",
  },
  price: {
    marginTop: "14px",
    marginBottom: "16px",
    color: "#86efac",
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
    fontWeight: 800,
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "18px",
  },
  chip: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#d4d4d8",
    borderRadius: "999px",
    fontSize: "12px",
    padding: "7px 11px",
  },
  desc: {
    color: "#9ca3af",
    lineHeight: 1.75,
    marginBottom: "18px",
    wordBreak: "break-word",
  },
  sellerCard: {
    background: "rgba(15,15,26,0.9)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "14px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
  },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
  },
  sellerLabel: {
    margin: 0,
    color: "#71717a",
    fontSize: "12px",
  },
  sellerName: {
    margin: 0,
    marginTop: "2px",
    fontSize: "17px",
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
    gap: "10px",
  },
  whatsappBtn: {
    background: "#22c55e",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "12px",
    padding: "12px",
    textAlign: "center",
    fontWeight: 700,
    whiteSpace: "nowrap",
    minHeight: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtn: {
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    padding: "12px",
    fontWeight: 600,
    minHeight: "44px",
  },
  relatedSection: {
    marginTop: "38px",
    animation: "fadeIn 0.5s ease both",
  },
  relatedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    gap: "10px",
    flexWrap: "wrap",
  },
  relatedTitle: {
    margin: 0,
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.4rem",
  },
  backLink: {
    color: "#a5b4fc",
    textDecoration: "none",
    fontSize: "13px",
  },
  relatedGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
    gap: "10px",
  },
  relatedCard: {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    overflow: "hidden",
    textDecoration: "none",
    background: "rgba(15,15,26,0.85)",
    color: "#fff",
    transition: "transform 200ms ease, box-shadow 200ms ease",
  },
  relatedImage: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
  },
  relatedBody: {
    padding: "10px",
  },
  relatedName: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.45,
    wordBreak: "break-word",
  },
  relatedPrice: {
    marginTop: "6px",
    marginBottom: 0,
    color: "#c7d2fe",
    fontWeight: 700,
  },
};