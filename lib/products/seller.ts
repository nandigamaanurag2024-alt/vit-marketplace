export type ProductSellerFields = {
  seller_id?: string | null;
  user_id?: string | null;
  seller_name?: string | null;
  seller_avatar?: string | null;
};

export type SellerProfile = {
  display_name: string | null;
  avatar_letter: string | null;
};

export function resolveProductSellerId(product: ProductSellerFields): string | null {
  return product.seller_id ?? product.user_id ?? null;
}

export function getSellerDisplayName(
  profile: SellerProfile | null | undefined,
  product: ProductSellerFields
): string {
  const fromProfile = profile?.display_name?.trim();
  if (fromProfile) return fromProfile;

  const fromProduct = product.seller_name?.trim();
  if (fromProduct) return fromProduct;

  return "Unknown Seller";
}

export function getSellerAvatarLetter(
  profile: SellerProfile | null | undefined,
  product: ProductSellerFields
): string {
  const fromProfile = profile?.avatar_letter?.trim()?.charAt(0);
  if (fromProfile) return fromProfile.toUpperCase();

  const fromProductAvatar = product.seller_avatar?.trim()?.charAt(0);
  if (fromProductAvatar) return fromProductAvatar.toUpperCase();

  const fromProductName = product.seller_name?.trim()?.charAt(0);
  if (fromProductName) return fromProductName.toUpperCase();

  return "U";
}
