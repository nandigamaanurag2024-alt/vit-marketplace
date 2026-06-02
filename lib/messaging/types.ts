export type ConversationRow = {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  buyer_last_read_at?: string | null;
  seller_last_read_at?: string | null;
  created_at: string;
};

export type ProductSnippet = {
  id: string;
  title: string | null;
  image_url: string | null;
  price: number | null;
};

export type ProfileSnippet = {
  id: string;
  display_name: string | null;
  avatar_letter: string | null;
};

export type InboxItem = ConversationRow & {
  product: ProductSnippet | null;
  counterpart: ProfileSnippet | null;
  role: "buying" | "selling";
  unreadCount: number;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};
