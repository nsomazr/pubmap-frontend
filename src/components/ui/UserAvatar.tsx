import { userInitials, userInitialsFromName } from "../../lib/userDisplay";
import type { User } from "../../types";
import { GreAvatarSlot } from "./GreHeroBanner";

type AvatarSize = "sm" | "md" | "lg";

interface Props {
  user?: Pick<User, "photo" | "firstname" | "lastname" | "full_name" | "updated_at"> | null;
  name?: string;
  photoUrl?: string | null;
  photoVersion?: string | null;
  size?: AvatarSize;
  className?: string;
}

export function UserAvatar({ user, name, photoUrl, photoVersion, size = "md", className }: Props) {
  const resolvedPhoto = photoUrl ?? user?.photo;
  const resolvedVersion = photoVersion ?? user?.updated_at ?? null;
  const initials = user ? userInitials(user) : userInitialsFromName(name);

  return (
    <GreAvatarSlot
      photoUrl={resolvedPhoto}
      photoVersion={resolvedVersion}
      initials={initials}
      size={size}
      className={className}
    />
  );
}
