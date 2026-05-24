import type { Publication, User } from "../types";

export interface ManagedCategory {
  id: number;
  name: string;
}

export function isPlatformAdmin(user: User | null | undefined): boolean {
  return user?.role_id === 1;
}

export function isCategoryManager(user: User | null | undefined): boolean {
  if (!user) return false;
  if (isPlatformAdmin(user)) return true;
  return Boolean(user.is_category_manager || (user.managed_categories?.length ?? 0) > 0);
}

export function canAccessReviewQueue(user: User | null | undefined): boolean {
  return isCategoryManager(user);
}

export function canReviewPublication(
  user: User | null | undefined,
  pub: Pick<Publication, "status" | "category_id">
): boolean {
  if (!user) return false;
  if (isPlatformAdmin(user)) return true;
  if (![1, 2].includes(pub.status)) return false;
  if (!pub.category_id) return false;
  return (user.managed_categories ?? []).some((cat) => cat.id === pub.category_id);
}

export function managedCategoryLabel(user: User | null | undefined): string {
  const names = (user?.managed_categories ?? []).map((c) => c.name);
  if (!names.length) return "";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
}
