export const USER_ROLES = ['Admin', 'Member', 'Viewer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'invited', 'suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

/** The writable fields of a user, as sent to create or update. */
export type UserDraft = Omit<User, 'id'>;

export interface UserPage {
  items: User[];
  total: number;
}

export const USER_SORT_FIELDS = ['name', 'email', 'role', 'status'] as const;
export type UserSortField = (typeof USER_SORT_FIELDS)[number];
export type SortDirection = 'asc' | 'desc';

/** One column to sort the list by. Sent as `sort=<field>:<direction>`. */
export interface UserSort {
  field: UserSortField;
  direction: SortDirection;
}

/** What narrows a list to part of the users. Every field is optional, and an empty one filters nothing. */
export interface UserFilter {
  /** Text to find in names and emails, ignoring case. Blank means no search. */
  q?: string;
  /** The exact role to keep. */
  role?: UserRole;
  /** The exact status to keep. */
  status?: UserStatus;
}

export interface PageRequest extends UserFilter {
  skip?: number;
  limit?: number;
  sort?: UserSort;
}

/** A resource paired with the ETag the server returned for it. */
export interface Versioned<T> {
  data: T;
  etag: string;
}
