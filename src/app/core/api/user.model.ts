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

export interface PageRequest {
  skip?: number;
  limit?: number;
}

/** A resource paired with the ETag the server returned for it. */
export interface Versioned<T> {
  data: T;
  etag: string;
}
