 "use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  fetchUnreadMessageCount,
  formatUnreadBadge,
  UNREAD_MESSAGES_REFRESH_EVENT,
} from "@/lib/messaging/unread";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#0a0a0a",
          color: "white",
          fontFamily: "'DM Sans', Arial, sans-serif",
          overflowX: "hidden",
        }}
      >
        <Navbar />

        {children}
      </body>
    </html>
  );
}

function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [hovered, setHovered] = useState<
    "brand" | "marketplace" | "messages" | "sell" | "auth"
    | null
  >(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUnreadCount(0);
      return;
    }

    const count = await fetchUnreadMessageCount(supabase, user.id);
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(Boolean(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    queueMicrotask(() => {
      void refreshUnreadCount();
    });
  }, [isAuthenticated, pathname, refreshUnreadCount]);

  const displayUnreadCount = isAuthenticated ? unreadCount : 0;

  useEffect(() => {
    const onRefresh = () => {
      void refreshUnreadCount();
    };

    window.addEventListener(UNREAD_MESSAGES_REFRESH_EVENT, onRefresh);
    return () => {
      window.removeEventListener(UNREAD_MESSAGES_REFRESH_EVENT, onRefresh);
    };
  }, [refreshUnreadCount]);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <nav style={styles.navbar}>
      <div style={styles.navGlow} />
      <div style={styles.navInner}>
        <Link
          href="/"
          style={{
            ...styles.brand,
            ...(hovered === "brand" ? styles.brandHovered : {}),
          }}
          onMouseEnter={() => setHovered("brand")}
          onMouseLeave={() => setHovered(null)}
        >
          VIT Marketplace
        </Link>

        <div style={styles.navActions}>
          <Link
            href="/marketplace"
            style={{
              ...styles.marketplaceLink,
              ...(hovered === "marketplace" ? styles.marketplaceLinkHovered : {}),
            }}
            onMouseEnter={() => setHovered("marketplace")}
            onMouseLeave={() => setHovered(null)}
          >
            Marketplace
          </Link>

          <Link
            href="/wishlist"
            style={{
              ...styles.marketplaceLink,
              ...(hovered === "marketplace" ? styles.marketplaceLinkHovered : {}),
            }}
            onMouseEnter={() => setHovered("marketplace")}
            onMouseLeave={() => setHovered(null)}
          >
            Wishlist
          </Link>

          {isAuthenticated ? (
            <Link
              href="/messages"
              style={{
                ...styles.messagesLink,
                ...(hovered === "messages" ? styles.marketplaceLinkHovered : {}),
              }}
              onMouseEnter={() => setHovered("messages")}
              onMouseLeave={() => setHovered(null)}
            >
              Messages
              {displayUnreadCount > 0 ? (
                <span style={styles.unreadBadge} aria-label={`${displayUnreadCount} unread messages`}>
                  {formatUnreadBadge(displayUnreadCount)}
                </span>
              ) : null}
            </Link>
          ) : null}

          <Link
            href="/sell"
            style={{
              ...styles.sellButton,
              ...(hovered === "sell" ? styles.sellButtonHovered : {}),
            }}
            onMouseEnter={() => setHovered("sell")}
            onMouseLeave={() => setHovered(null)}
          >
            Sell Item
          </Link>

          {isAuthenticated ? (
            <button onClick={handleLogout} style={styles.authButton}>
              Logout
            </button>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  ...styles.marketplaceLink,
                  ...(hovered === "marketplace" ? styles.marketplaceLinkHovered : {}),
                }}
                onMouseEnter={() => setHovered("marketplace")}
                onMouseLeave={() => setHovered(null)}
              >
                Login
              </Link>
              <Link
                href="/signup"
                style={{
                  ...styles.authButton,
                  ...(hovered === "auth" ? styles.authButtonHovered : {}),
                }}
                onMouseEnter={() => setHovered("auth")}
                onMouseLeave={() => setHovered(null)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 1100,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(10,10,16,0.62)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
  },

  navGlow: {
    position: "absolute",
    top: "-60px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "560px",
    height: "140px",
    background:
      "radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.06) 35%, transparent 72%)",
    pointerEvents: "none",
  },

  navInner: {
    maxWidth: "1240px",
    margin: "auto",
    padding: "12px clamp(12px, 4vw, 20px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    position: "relative",
  },

  brand: {
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "clamp(1.25rem, 3vw, 1.8rem)",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    transition: "opacity 220ms ease, transform 220ms ease",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },

  brandHovered: {
    opacity: 0.88,
    transform: "translateY(-1px)",
  },

  navActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginLeft: "auto",
    flexWrap: "nowrap",
    overflowX: "auto",
    maxWidth: "100%",
    paddingBottom: "2px",
    WebkitOverflowScrolling: "touch",
  },

  marketplaceLink: {
    color: "#d4d4d8",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "14px",
    letterSpacing: "0.01em",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    padding: "10px 14px",
    borderRadius: "11px",
    transition: "all 220ms cubic-bezier(0.16, 1, 0.3, 1)",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  marketplaceLinkHovered: {
    color: "#f4f4f5",
    borderColor: "rgba(99,102,241,0.58)",
    background: "rgba(99,102,241,0.12)",
    transform: "translateY(-1px)",
    boxShadow: "0 8px 20px rgba(99,102,241,0.2)",
  },

  messagesLink: {
    color: "#d4d4d8",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "14px",
    letterSpacing: "0.01em",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    padding: "10px 14px",
    borderRadius: "11px",
    transition: "all 220ms cubic-bezier(0.16, 1, 0.3, 1)",
    whiteSpace: "nowrap",
    flexShrink: 0,
    position: "relative",
  },

  unreadBadge: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    minWidth: "18px",
    height: "18px",
    padding: "0 5px",
    borderRadius: "999px",
    background: "#ef4444",
    color: "#fff",
    fontSize: "10px",
    fontWeight: 800,
    lineHeight: "18px",
    textAlign: "center",
    border: "2px solid rgba(10,10,16,0.95)",
    boxShadow: "0 4px 10px rgba(239,68,68,0.45)",
    pointerEvents: "none",
  },

  sellButton: {
    background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
    color: "white",
    padding: "10px 16px",
    borderRadius: "11px",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
    letterSpacing: "0.01em",
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "0 10px 24px rgba(79,70,229,0.35)",
    transition: "transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms ease, opacity 220ms ease",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  sellButtonHovered: {
    transform: "translateY(-1px) scale(1.015)",
    boxShadow: "0 14px 30px rgba(79,70,229,0.44)",
    opacity: 0.98,
  },
  authButton: {
    background: "rgba(255,255,255,0.08)",
    color: "#f4f4f5",
    padding: "10px 14px",
    borderRadius: "11px",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "14px",
    letterSpacing: "0.01em",
    border: "1px solid rgba(255,255,255,0.14)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  authButtonHovered: {
    transform: "translateY(-1px)",
    background: "rgba(99,102,241,0.2)",
    borderColor: "rgba(99,102,241,0.5)",
  },
};