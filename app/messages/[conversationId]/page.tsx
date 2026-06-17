"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { MAX_MESSAGE_LENGTH, PLACEHOLDER_IMAGE } from "@/lib/messaging/constants";
import {
  dispatchUnreadMessagesRefresh,
  markConversationAsRead,
} from "@/lib/messaging/unread";
import type {
  ConversationRow,
  MessageRow,
  ProductSnippet,
  ProfileSnippet,
} from "@/lib/messaging/types";

function formatMessageTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ConversationThreadPage() {
  const params = useParams();
  const rawId = params?.conversationId;
  const conversationId = Array.isArray(rawId) ? rawId[0] : rawId ?? "";

  const [userId, setUserId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationRow | null>(null);
  const [product, setProduct] = useState<ProductSnippet | null>(null);
  const [counterpart, setCounterpart] = useState<ProfileSnippet | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const loadThread = useCallback(async () => {
    if (!conversationId) {
      setError("Invalid conversation.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(userError?.message ?? "You must be logged in.");
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data: convData, error: convError } = await supabase
      .from("conversations")
      .select(
        "id,product_id,buyer_id,seller_id,last_message_at,last_message_preview,created_at"
      )
      .eq("id", conversationId)
      .maybeSingle();

    if (convError) {
      setError(convError.message);
      setLoading(false);
      return;
    }

    if (!convData) {
      setError("Conversation not found or you do not have access.");
      setLoading(false);
      return;
    }

    const conv = convData as ConversationRow;
    if (conv.buyer_id !== user.id && conv.seller_id !== user.id) {
      setError("Conversation not found or you do not have access.");
      setLoading(false);
      return;
    }

    setConversation(conv);

    const counterpartId =
      conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;

    const [
      { data: productData, error: productError },
      { data: profileData, error: profileError },
      { data: messageData, error: messageError },
    ] = await Promise.all([
      supabase
        .from("products")
        .select("id,title,image_url,price")
        .eq("id", conv.product_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id,display_name,avatar_letter")
        .eq("id", counterpartId)
        .maybeSingle(),
      supabase
        .from("messages")
        .select("id,conversation_id,sender_id,body,created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true }),
    ]);

    if (productError || profileError || messageError) {
      setError(
        productError?.message ??
          profileError?.message ??
          messageError?.message ??
          "Failed to load conversation."
      );
      setLoading(false);
      return;
    }

    setProduct((productData as ProductSnippet | null) ?? null);
    setCounterpart((profileData as ProfileSnippet | null) ?? null);
    setMessages((messageData ?? []) as MessageRow[]);

    await markConversationAsRead(supabase, conversationId, user.id, conv);
    dispatchUnreadMessagesRefresh();

    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadThread();
    });
  }, [loadThread]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading, messages.length]);

  const counterpartName = useMemo(() => {
    return counterpart?.display_name?.trim() || "Unknown user";
  }, [counterpart]);

  const productTitle = product?.title?.trim() || "Untitled listing";

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSendError(null);

    const body = draft.trim();
    if (!body) {
      setSendError("Message cannot be empty.");
      return;
    }
    if (body.length > MAX_MESSAGE_LENGTH) {
      setSendError(`Message must be ${MAX_MESSAGE_LENGTH} characters or less.`);
      return;
    }
    if (!userId || !conversationId) return;

    setSending(true);

    const supabase = getSupabaseBrowserClient();
    const { data: inserted, error: insertError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        body,
      })
      .select("id,conversation_id,sender_id,body,created_at")
      .single();

    if (insertError) {
      setSendError(insertError.message);
      setSending(false);
      return;
    }

    setMessages((prev) => [...prev, inserted as MessageRow]);
    setDraft("");
    setSending(false);

    if (conversation) {
      setConversation({
        ...conversation,
        last_message_at: inserted.created_at,
        last_message_preview: body.slice(0, 120),
      });
      await markConversationAsRead(supabase, conversationId, userId, conversation);
      dispatchUnreadMessagesRefresh();
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.glow} />
      <section style={styles.shell}>
        <header style={styles.header}>
          <Link href="/messages" style={styles.backBtn}>
            ← Inbox
          </Link>
          {!loading && !error && conversation ? (
            <Link
              href={`/marketplace/${conversation.product_id}`}
              style={styles.productCard}
            >
              <img
                src={product?.image_url?.trim() || PLACEHOLDER_IMAGE}
                alt={productTitle}
                style={styles.productThumb}
              />
              <div style={styles.productInfo}>
                <p style={styles.productTitle}>{productTitle}</p>
                <p style={styles.productMeta}>
                  {product?.price != null
                    ? `₹${product.price.toLocaleString()}`
                    : "Price unavailable"}{" "}
                  · with {counterpartName}
                </p>
              </div>
            </Link>
          ) : null}
        </header>

        {loading ? (
          <div style={styles.stateCard}>
            <p style={styles.stateTitle}>Loading conversation...</p>
          </div>
        ) : error ? (
          <div style={styles.stateCard}>
            <p style={styles.stateTitle}>Could not open conversation</p>
            <p style={styles.stateText}>{error}</p>
            <div style={styles.stateActions}>
              <button
                type="button"
                onClick={() => void loadThread()}
                style={styles.retryBtn}
              >
                Try again
              </button>
              <Link href="/messages" style={styles.secondaryLink}>
                Back to inbox
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div style={styles.thread}>
              {messages.length === 0 ? (
                <div style={styles.emptyThread}>
                  <p style={styles.emptyTitle}>No messages yet</p>
                  <p style={styles.emptyText}>
                    Say hello to {counterpartName} about this listing.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === userId;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        ...styles.bubbleRow,
                        ...(isMine ? styles.bubbleRowMine : {}),
                      }}
                    >
                      <div
                        style={{
                          ...styles.bubble,
                          ...(isMine ? styles.bubbleMine : styles.bubbleTheirs),
                        }}
                      >
                        <p style={styles.bubbleBody}>{msg.body}</p>
                        <span style={styles.bubbleTime}>
                          {formatMessageTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} style={styles.composer}>
              {sendError ? <p style={styles.sendError}>{sendError}</p> : null}
              <div style={styles.composerRow}>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  rows={2}
                  maxLength={MAX_MESSAGE_LENGTH}
                  style={styles.input}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  style={{
                    ...styles.sendBtn,
                    ...(sending || !draft.trim() ? styles.sendBtnDisabled : {}),
                  }}
                >
                  {sending ? "..." : "Send"}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#07070f",
    display: "flex",
    flexDirection: "column",
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
  shell: {
    maxWidth: "720px",
    margin: "0 auto",
    width: "100%",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    position: "relative",
    zIndex: 1,
    padding: "clamp(12px, 3vw, 20px) clamp(12px, 3vw, 16px)",
    paddingBottom: "max(12px, env(safe-area-inset-bottom))",
  },
  header: {
    flexShrink: 0,
    marginBottom: "12px",
  },
  backBtn: {
    color: "#a5b4fc",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 600,
    display: "inline-block",
    marginBottom: "10px",
  },
  productCard: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    textDecoration: "none",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "10px",
    background: "rgba(15,15,26,0.9)",
  },
  productThumb: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    objectFit: "cover",
    flexShrink: 0,
  },
  productInfo: { minWidth: 0 },
  productTitle: {
    margin: 0,
    fontWeight: 700,
    fontSize: "14px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  productMeta: {
    margin: "4px 0 0",
    color: "#9ca3af",
    fontSize: "12px",
  },
  stateCard: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "32px 20px",
    background: "rgba(15,15,26,0.85)",
    textAlign: "center",
  },
  stateTitle: {
    margin: 0,
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.15rem",
  },
  stateText: {
    marginTop: "10px",
    color: "#9ca3af",
    lineHeight: 1.6,
    fontSize: "14px",
  },
  stateActions: {
    marginTop: "16px",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "center",
  },
  retryBtn: {
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 18px",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryLink: {
    color: "#a5b4fc",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 600,
    padding: "10px 14px",
  },
  thread: {
    flex: 1,
    overflowY: "auto",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "14px",
    background: "rgba(15,15,26,0.75)",
    padding: "clamp(12px, 3vw, 16px)",
    minHeight: "200px",
    maxHeight: "calc(100vh - 280px)",
    marginBottom: "12px",
  },
  emptyThread: {
    textAlign: "center",
    padding: "40px 16px",
  },
  emptyTitle: {
    margin: 0,
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.1rem",
  },
  emptyText: {
    marginTop: "8px",
    color: "#9ca3af",
    fontSize: "14px",
  },
  bubbleRow: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: "10px",
  },
  bubbleRowMine: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "min(85%, 420px)",
    borderRadius: "14px",
    padding: "10px 12px",
  },
  bubbleMine: {
    background: "linear-gradient(135deg, rgba(79,70,229,0.9), rgba(99,102,241,0.85))",
    border: "1px solid rgba(129,140,248,0.4)",
  },
  bubbleTheirs: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  bubbleBody: {
    margin: 0,
    lineHeight: 1.55,
    fontSize: "14px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  bubbleTime: {
    display: "block",
    marginTop: "6px",
    fontSize: "10px",
    color: "rgba(255,255,255,0.55)",
    textAlign: "right",
  },
  composer: {
    flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    background: "rgba(15,15,26,0.95)",
    padding: "10px",
  },
  sendError: {
    margin: "0 0 8px",
    color: "#fca5a5",
    fontSize: "12px",
  },
  composerRow: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  input: {
    flex: 1,
    minWidth: "min(100%, 200px)",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    color: "#fff",
    padding: "10px 12px",
    fontSize: "15px",
    resize: "vertical",
    fontFamily: "inherit",
    outline: "none",
  },
  sendBtn: {
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 20px",
    fontWeight: 700,
    cursor: "pointer",
    minHeight: "44px",
    flexShrink: 0,
  },
  sendBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};
