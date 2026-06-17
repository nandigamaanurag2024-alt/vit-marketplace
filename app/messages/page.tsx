"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { PLACEHOLDER_IMAGE } from "@/lib/messaging/constants";
import {
  computeUnreadState,
  fetchIncomingMessages,
  formatUnreadBadge,
  UNREAD_MESSAGES_REFRESH_EVENT,
} from "@/lib/messaging/unread";
import type { ConversationReadRow } from "@/lib/messaging/unread";
import type {
  ConversationRow,
  InboxItem,
  ProductSnippet,
  ProfileSnippet,
} from "@/lib/messaging/types";

function formatRelativeTime(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getCounterpartId(conv: ConversationRow, userId: string) {
  return conv.buyer_id === userId ? conv.seller_id : conv.buyer_id;
}

export default function MessagesInboxPage() {
  const pathname = usePathname();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "buying" | "selling">("all");

  const loadSeqRef = useRef(0);

  const loadInbox = useCallback(async () => {
    const loadSeq = ++loadSeqRef.current;
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();
      let user = session?.user ?? null;

      if (!user) {
        const {
          data: { user: refreshedUser },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) {
          console.error("[messages/inbox] auth.getUser failed:", userError.message);
          if (loadSeq === loadSeqRef.current) {
            setError(userError.message);
          }
          return;
        }
        user = refreshedUser;
      }

      if (!user) {
        if (loadSeq === loadSeqRef.current) {
          setError("You must be logged in to view messages.");
        }
        return;
      }

      const conversationSelectWithRead =
        "id,product_id,buyer_id,seller_id,last_message_at,last_message_preview,buyer_last_read_at,seller_last_read_at,created_at";
      const conversationSelectBase =
        "id,product_id,buyer_id,seller_id,last_message_at,last_message_preview,created_at";

      let conversationsData: ConversationRow[] | null = null;
      let convError: { message: string } | null = null;

      const primaryResult = await supabase
        .from("conversations")
        .select(conversationSelectWithRead)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      conversationsData = (primaryResult.data ?? null) as ConversationRow[] | null;
      convError = primaryResult.error;

      if (convError) {
        console.error(
          "[messages/inbox] conversations query (with read columns) failed:",
          convError.message
        );
        const fallbackResult = await supabase
          .from("conversations")
          .select(conversationSelectBase)
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });

        conversationsData = (fallbackResult.data ?? null) as ConversationRow[] | null;
        convError = fallbackResult.error;
      }

      if (convError) {
        console.error("[messages/inbox] conversations query failed:", convError.message);
        if (loadSeq === loadSeqRef.current) {
          setError(`Could not load conversations: ${convError.message}`);
        }
        return;
      }

      const rows = conversationsData ?? [];
      if (rows.length === 0) {
        if (loadSeq === loadSeqRef.current) {
          setItems([]);
        }
        return;
      }

      const readRows = rows.map((row) => ({
        ...row,
        buyer_last_read_at: row.buyer_last_read_at ?? null,
        seller_last_read_at: row.seller_last_read_at ?? null,
      })) as ConversationReadRow[];

      const conversationIds = rows.map((r) => r.id);
      const productIds = [...new Set(rows.map((r) => r.product_id))];
      const profileIds = [
        ...new Set(rows.map((r) => getCounterpartId(r, user.id))),
      ];

      const productsQuery = supabase
        .from("products")
        .select("id,title,image_url,price")
        .in("id", productIds);

      const profilesQuery =
        profileIds.length > 0
          ? supabase
              .from("profiles")
              .select("id,display_name,avatar_letter")
              .in("id", profileIds)
          : Promise.resolve({ data: [] as ProfileSnippet[], error: null });

      const [
        { data: products, error: productsError },
        { data: profiles, error: profilesError },
        incomingMessages,
      ] = await Promise.all([
        productsQuery,
        profilesQuery,
        fetchIncomingMessages(supabase, conversationIds, user.id),
      ]);

      if (productsError) {
        console.error("[messages/inbox] products query failed:", productsError.message);
        if (loadSeq === loadSeqRef.current) {
          setError(`Could not load listing details: ${productsError.message}`);
        }
        return;
      }

      if (profilesError) {
        console.error("[messages/inbox] profiles query failed:", profilesError.message);
      }

      const unreadState = computeUnreadState(readRows, incomingMessages, user.id);

      const productMap = new Map(
        ((products ?? []) as ProductSnippet[]).map((p) => [p.id, p])
      );
      const profileMap = new Map(
        ((profiles ?? []) as ProfileSnippet[]).map((p) => [p.id, p])
      );

      const enriched: InboxItem[] = rows.map((row) => {
        const counterpartId = getCounterpartId(row, user.id);
        return {
          ...row,
          product: productMap.get(row.product_id) ?? null,
          counterpart: profileMap.get(counterpartId) ?? null,
          role: row.buyer_id === user.id ? "buying" : "selling",
          unreadCount: unreadState.byConversationId[row.id] ?? 0,
        };
      });

      if (loadSeq === loadSeqRef.current) {
        setItems(enriched);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      console.error("[messages/inbox] loadInbox failed:", err);
      if (loadSeq === loadSeqRef.current) {
        setError(message);
      }
    } finally {
      if (loadSeq === loadSeqRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadInbox();
    });
  }, [loadInbox, pathname]);

  // Refresh inbox when returning from a thread (read state updated elsewhere).
  useEffect(() => {
    const onRefresh = () => {
      void loadInbox();
    };
    window.addEventListener(UNREAD_MESSAGES_REFRESH_EVENT, onRefresh);
    return () => {
      window.removeEventListener(UNREAD_MESSAGES_REFRESH_EVENT, onRefresh);
    };
  }, [loadInbox]);

  const filtered = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "buying") return item.role === "buying";
    return item.role === "selling";
  });

  return (
    <main style={styles.page}>
      <div style={styles.glow} />
      <section style={styles.container}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>INBOX</p>
            <h1 style={styles.title}>Messages</h1>
            <p style={styles.subtitle}>
              Conversations about your listings and items you&apos;re buying.
            </p>
          </div>
          <Link href="/marketplace" style={styles.backLink}>
            Marketplace
          </Link>
        </div>

        <div style={styles.filterRow}>
          {(["all", "buying", "selling"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              style={{
                ...styles.filterBtn,
                ...(filter === key ? styles.filterBtnActive : {}),
              }}
            >
              {key === "all" ? "All" : key === "buying" ? "Buying" : "Selling"}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.stateCard}>
            <p style={styles.stateTitle}>Loading messages...</p>
          </div>
        ) : error ? (
          <div style={styles.stateCard}>
            <p style={styles.stateTitle}>Could not load inbox</p>
            <p style={styles.stateText}>{error}</p>
            <button type="button" onClick={() => void loadInbox()} style={styles.retryBtn}>
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.stateCard}>
            <p style={styles.stateEmoji}>💬</p>
            <p style={styles.stateTitle}>
              {items.length === 0 ? "No conversations yet" : "No conversations in this filter"}
            </p>
            <p style={styles.stateText}>
              {items.length === 0
                ? "When you message a seller about a listing, it will appear here."
                : "Try another filter to see more threads."}
            </p>
            {items.length === 0 ? (
              <Link href="/marketplace" style={styles.primaryLink}>
                Browse marketplace
              </Link>
            ) : null}
          </div>
        ) : (
          <ul style={styles.list}>
            {filtered.map((item) => {
              const productTitle = item.product?.title?.trim() || "Untitled listing";
              const counterpartName =
                item.counterpart?.display_name?.trim() || "Unknown user";
              const avatarLetter =
                item.counterpart?.avatar_letter?.trim()?.charAt(0)?.toUpperCase() ||
                counterpartName.charAt(0)?.toUpperCase() ||
                "U";
              const sortTime = item.last_message_at ?? item.created_at;
              const hasUnread = item.unreadCount > 0;

              return (
                <li key={item.id} style={styles.listItem}>
                  <Link
                    href={`/messages/${item.id}`}
                    style={{
                      ...styles.rowLink,
                      ...(hasUnread ? styles.rowLinkUnread : {}),
                    }}
                  >
                    <img
                      src={item.product?.image_url?.trim() || PLACEHOLDER_IMAGE}
                      alt={productTitle}
                      style={styles.thumb}
                    />
                    <div style={styles.rowBody}>
                      <div style={styles.rowTop}>
                        <span
                          style={{
                            ...styles.productName,
                            ...(hasUnread ? styles.productNameUnread : {}),
                          }}
                        >
                          {productTitle}
                        </span>
                        <div style={styles.rowTopRight}>
                          {hasUnread ? (
                            <span
                              style={styles.rowUnreadBadge}
                              aria-label={`${item.unreadCount} unread`}
                            >
                              {formatUnreadBadge(item.unreadCount)}
                            </span>
                          ) : null}
                          <span style={styles.time}>
                            {formatRelativeTime(sortTime)}
                          </span>
                        </div>
                      </div>
                      <div style={styles.rowMeta}>
                        <span style={styles.avatar}>{avatarLetter}</span>
                        <span style={styles.counterpart}>{counterpartName}</span>
                        <span
                          style={{
                            ...styles.roleBadge,
                            ...(item.role === "selling"
                              ? styles.roleSelling
                              : styles.roleBuying),
                          }}
                        >
                          {item.role === "selling" ? "Selling" : "Buying"}
                        </span>
                      </div>
                      <p
                        style={{
                          ...styles.preview,
                          ...(hasUnread ? styles.previewUnread : {}),
                        }}
                      >
                        {item.last_message_preview?.trim() || "No messages yet"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
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
    maxWidth: "720px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "18px",
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
    fontSize: "clamp(1.6rem, 7vw, 2.4rem)",
    lineHeight: 1.05,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    marginTop: "10px",
    color: "#9ca3af",
    lineHeight: 1.6,
    fontSize: "clamp(0.9rem, 2.8vw, 1rem)",
    maxWidth: "480px",
  },
  backLink: {
    color: "#a5b4fc",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    paddingTop: "4px",
  },
  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "16px",
  },
  filterBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#d4d4d8",
    borderRadius: "999px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  filterBtnActive: {
    background: "rgba(99,102,241,0.2)",
    borderColor: "rgba(99,102,241,0.55)",
    color: "#e0e7ff",
  },
  stateCard: {
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "clamp(24px, 5vw, 40px)",
    textAlign: "center",
    background: "rgba(15,15,26,0.85)",
  },
  stateEmoji: { fontSize: "2rem", margin: "0 0 8px" },
  stateTitle: {
    margin: 0,
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.2rem",
  },
  stateText: {
    marginTop: "10px",
    color: "#9ca3af",
    lineHeight: 1.6,
    fontSize: "14px",
  },
  retryBtn: {
    marginTop: "16px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 18px",
    fontWeight: 600,
    cursor: "pointer",
  },
  primaryLink: {
    display: "inline-block",
    marginTop: "16px",
    background: "#2563eb",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "10px",
    padding: "10px 18px",
    fontWeight: 600,
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  listItem: { margin: 0 },
  rowLink: {
    display: "flex",
    gap: "12px",
    textDecoration: "none",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "14px",
    padding: "12px",
    background: "rgba(15,15,26,0.9)",
    transition: "border-color 200ms ease, background 200ms ease",
  },
  rowLinkUnread: {
    borderColor: "rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.06)",
  },
  thumb: {
    width: "64px",
    height: "64px",
    borderRadius: "10px",
    objectFit: "cover",
    flexShrink: 0,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "8px",
  },
  rowTopRight: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
  },
  productName: {
    fontWeight: 700,
    fontSize: "15px",
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  productNameUnread: {
    color: "#fef2f2",
  },
  rowUnreadBadge: {
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
    flexShrink: 0,
  },
  time: {
    color: "#71717a",
    fontSize: "11px",
    flexShrink: 0,
  },
  rowMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "6px",
    flexWrap: "wrap",
  },
  avatar: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 700,
    flexShrink: 0,
  },
  counterpart: {
    color: "#d4d4d8",
    fontSize: "13px",
  },
  roleBadge: {
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    padding: "3px 8px",
    borderRadius: "999px",
  },
  roleBuying: {
    background: "rgba(34,211,238,0.12)",
    color: "#67e8f9",
    border: "1px solid rgba(34,211,238,0.35)",
  },
  roleSelling: {
    background: "rgba(99,102,241,0.15)",
    color: "#c7d2fe",
    border: "1px solid rgba(99,102,241,0.4)",
  },
  preview: {
    margin: "8px 0 0",
    color: "#9ca3af",
    fontSize: "13px",
    lineHeight: 1.45,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  previewUnread: {
    color: "#e4e4e7",
    fontWeight: 600,
  },
};
