'use client';

import { selectUser, useAuthStore } from '@/features/auth/store/auth.store';

/** "Jane van Doe" -> "JD", "Jane" -> "J". */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

/** The signed-in user's avatar, name and email. Rendered inside the protected layout. */
export function CurrentUser() {
  const user = useAuthStore(selectUser);
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-accent"
      >
        {getInitials(user.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium">{user.name}</p>
        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
      </div>
    </div>
  );
}
