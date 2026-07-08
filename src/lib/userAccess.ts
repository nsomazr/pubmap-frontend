import type { Publication, User } from "../types";

export interface ManagedCategory {
  id: number;
  name: string;
}

export function isPlatformAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.is_admin === true) return true;
  if (user.role_name?.toLowerCase() === "admin") return true;
  return false;
}

export function isCategoryManager(user: User | null | undefined): boolean {
  if (!user) return false;
  if (isPlatformAdmin(user)) return true;
  return Boolean(user.is_category_manager || (user.managed_subcategories?.length ?? 0) > 0);
}

export function canAccessReviewQueue(user: User | null | undefined): boolean {
  return isCategoryManager(user);
}

export function canReviewPublication(
  user: User | null | undefined,
  pub: Pick<Publication, "status" | "sub_category_id">
): boolean {
  if (!user) return false;
  if (isPlatformAdmin(user)) return true;
  if (![1, 2].includes(pub.status)) return false;
  if (!pub.sub_category_id) return false;
  return (user.managed_subcategories ?? []).some((sub) => sub.id === pub.sub_category_id);
}

export function managedCategoryLabel(user: User | null | undefined): string {
  const names = (user?.managed_subcategories ?? []).map((sub) =>
    sub.category_name ? `${sub.category_name}: ${sub.name}` : sub.name
  );
  if (!names.length) return "";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
}
