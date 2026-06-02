import type { SupabaseClient } from "@supabase/supabase-js";

export const UNREAD_MESSAGES_REFRESH_EVENT = "vit-marketplace:unread-messages-refresh";

export type ConversationReadRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  buyer_last_read_at: string | null;
  seller_last_read_at: string | null;
};

export type IncomingMessageRow = {
  conversation_id: string;
  sender_id: string;
  created_at: string;
};

export type UnreadState = {
  total: number;
  byConversationId: Record<string, number>;
};

export function dispatchUnreadMessagesRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(UNREAD_MESSAGES_REFRESH_EVENT));
  }
}

export function formatUnreadBadge(count: number): string {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
}

export function getLastReadAtForUser(
  conversation: ConversationReadRow,
  userId: string
): string | null {
  if (conversation.buyer_id === userId) {
    return conversation.buyer_last_read_at;
  }
  if (conversation.seller_id === userId) {
    return conversation.seller_last_read_at;
  }
  return null;
}

/** Incoming message the current user has not read yet. */
export function isMessageUnread(
  message: { sender_id: string; created_at: string },
  conversation: ConversationReadRow,
  userId: string
): boolean {
  if (message.sender_id === userId) return false;

  const lastReadAt = getLastReadAtForUser(conversation, userId);
  if (!lastReadAt) return true;

  return (
    new Date(message.created_at).getTime() > new Date(lastReadAt).getTime()
  );
}

export function countUnreadInConversation(
  messages: IncomingMessageRow[],
  conversation: ConversationReadRow,
  userId: string
): number {
  let count = 0;
  for (const message of messages) {
    if (
      message.conversation_id === conversation.id &&
      isMessageUnread(message, conversation, userId)
    ) {
      count += 1;
    }
  }
  return count;
}

/** Pure: aggregate unread totals from already-fetched rows. */
export function computeUnreadState(
  conversations: ConversationReadRow[],
  incomingMessages: IncomingMessageRow[],
  userId: string
): UnreadState {
  const byConversationId: Record<string, number> = {};
  let total = 0;

  for (const conversation of conversations) {
    const count = countUnreadInConversation(
      incomingMessages,
      conversation,
      userId
    );
    if (count > 0) {
      byConversationId[conversation.id] = count;
      total += count;
    }
  }

  return { total, byConversationId };
}

export async function fetchIncomingMessages(
  supabase: SupabaseClient,
  conversationIds: string[],
  userId: string
): Promise<IncomingMessageRow[]> {
  if (conversationIds.length === 0) return [];

  const { data: messages, error } = await supabase
    .from("messages")
    .select("conversation_id,sender_id,created_at")
    .in("conversation_id", conversationIds)
    .neq("sender_id", userId);

  if (error || !messages?.length) return [];
  return messages as IncomingMessageRow[];
}

export async function fetchParticipantConversations(
  supabase: SupabaseClient,
  userId: string
): Promise<ConversationReadRow[]> {
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("id,buyer_id,seller_id,buyer_last_read_at,seller_last_read_at")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

  if (error || !conversations?.length) return [];
  return conversations as ConversationReadRow[];
}

/**
 * Two queries: participant conversations + incoming messages (not sent by user).
 * Unread = incoming where last_read_at is null OR created_at > last_read_at.
 */
export async function fetchUnreadState(
  supabase: SupabaseClient,
  userId: string
): Promise<UnreadState> {
  const conversations = await fetchParticipantConversations(supabase, userId);
  if (conversations.length === 0) {
    return { total: 0, byConversationId: {} };
  }

  const conversationIds = conversations.map((row) => row.id);
  const incomingMessages = await fetchIncomingMessages(
    supabase,
    conversationIds,
    userId
  );

  return computeUnreadState(conversations, incomingMessages, userId);
}

export async function fetchUnreadMessageCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const state = await fetchUnreadState(supabase, userId);
  return state.total;
}

export function getConversationUnreadCount(
  state: UnreadState,
  conversationId: string
): number {
  return state.byConversationId[conversationId] ?? 0;
}

export async function markConversationAsRead(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
  conversation: { buyer_id: string; seller_id: string }
): Promise<void> {
  const now = new Date().toISOString();
  const updates =
    conversation.buyer_id === userId
      ? { buyer_last_read_at: now }
      : conversation.seller_id === userId
        ? { seller_last_read_at: now }
        : null;

  if (!updates) return;

  const { error } = await supabase
    .from("conversations")
    .update(updates)
    .eq("id", conversationId);

  if (error) {
    console.error("markConversationAsRead failed:", error.message);
  }
}
