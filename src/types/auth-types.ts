export interface AuthUser {
  id: string;
  clerkUserId: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: "CREATOR" | "ADMIN" | "USER";
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  deletedAt: string | null;
}