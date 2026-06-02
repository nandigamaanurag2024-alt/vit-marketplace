import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      title: "Verified Student Listings",
      description:
        "Buy and sell with confidence inside campus communities, built for VIT students only.",
      icon: "🛡️",
    },
    {
      title: "Fast Discovery",
      description:
        "Search books, electronics, cycles, room essentials and more in seconds with smart filters.",
      icon: "⚡",
    },
    {
      title: "Campus-First Experience",
      description:
        "Meet nearby sellers, compare listings quickly, and close deals without platform friction.",
      icon: "🎓",
    },
  ];

  return (
    <main style={styles.page}>
      <div style={styles.topGlow} />

      <section style={styles.heroSection}>
        <div style={styles.heroBadge}>VIT STUDENT MARKETPLACE</div>

        <h1 style={styles.heroTitle}>
          The premium campus marketplace
          <br />
          for modern student life.
        </h1>

        <p style={styles.heroSubtitle}>
          Buy and sell electronics, books, cycles, gaming gear and hostel
          essentials with a trusted VIT-first experience.
        </p>

        <div style={styles.heroButtons}>
          <Link href="/marketplace" style={styles.primaryButton}>
            Explore Marketplace
          </Link>
          <Link href="/sell" style={styles.secondaryButton}>
            List an Item
          </Link>
        </div>
      </section>

      <section style={styles.featuresSection}>
        <div style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <article
              key={feature.title}
              style={{
                ...styles.featureCard,
                animationDelay: `${index * 80}ms`,
              }}
            >
              <span style={styles.featureIcon}>{feature.icon}</span>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureDescription}>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 50% -10%, rgba(59,130,246,0.28) 0%, rgba(9,9,11,0.96) 42%), #0a0a0a",
    color: "white",
    padding: "48px 24px 88px",
  },

  topGlow: {
    position: "fixed",
    top: -120,
    left: "50%",
    transform: "translateX(-50%)",
    width: "980px",
    height: "420px",
    background:
      "radial-gradient(ellipse at center, rgba(99,102,241,0.28) 0%, rgba(34,211,238,0.09) 30%, transparent 72%)",
    pointerEvents: "none",
    zIndex: 0,
  },

  heroSection: {
    maxWidth: "1120px",
    margin: "0 auto",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
    padding: "72px 0 56px",
  },

  heroBadge: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.18em",
    color: "#7dd3fc",
    background: "rgba(56,189,248,0.08)",
    border: "1px solid rgba(125,211,252,0.34)",
    borderRadius: "999px",
    padding: "9px 14px",
  },

  heroTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(2.15rem, 7vw, 5.4rem)",
    lineHeight: 1.02,
    letterSpacing: "-0.03em",
    fontWeight: 800,
    maxWidth: "980px",
    margin: "30px auto 0",
  },

  heroSubtitle: {
    color: "#a1a1aa",
    fontSize: "clamp(1rem, 2.1vw, 1.35rem)",
    lineHeight: 1.7,
    maxWidth: "760px",
    margin: "24px auto 0",
  },

  heroButtons: {
    marginTop: "42px",
    display: "flex",
    justifyContent: "center",
    gap: "14px",
    flexWrap: "wrap",
  },

  primaryButton: {
    background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
    color: "white",
    padding: "14px 26px",
    borderRadius: "14px",
    fontWeight: 700,
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 10px 30px rgba(37,99,235,0.35)",
  },

  secondaryButton: {
    background: "rgba(20,20,24,0.95)",
    border: "1px solid #2f2f37",
    color: "#f4f4f5",
    padding: "14px 26px",
    borderRadius: "14px",
    fontWeight: 700,
    boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
  },

  featuresSection: {
    maxWidth: "1120px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "18px",
  },

  featureCard: {
    background:
      "linear-gradient(165deg, rgba(18,18,26,0.96) 0%, rgba(12,12,18,0.98) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 26px rgba(0,0,0,0.34)",
    animation: "fadeInUp 0.5s ease both",
  },

  featureIcon: {
    fontSize: "22px",
    display: "inline-block",
    marginBottom: "14px",
  },

  featureTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.15rem",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    marginBottom: "8px",
    color: "#f8fafc",
  },

  featureDescription: {
    color: "#9ca3af",
    lineHeight: 1.65,
    fontSize: "0.96rem",
  },
};