import type { UserRole } from './user-role.enum';

export type AuthUser = {
  userId: string;
  role: UserRole;
  businessId?: string | null;
};

