export type UserRole = "buyer" | "seller" | "admin";

export interface User {
  id: string;
  email: string | null;
  phone: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  region: string | null;
  province: string | null;
  city: string | null;
  barangay: string | null;
  addressLine: string | null;
  zipCode: string | null;
  language: "fil" | "en";
  createdAt: string;
  updatedAt: string;
}

export interface UserPublicProfile {
  id: string;
  displayName: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  province: string | null;
  city: string | null;
  createdAt: string;
}

export interface SellerProfile {
  id: string;
  userId: string;
  farmName: string;
  businessType: "individual" | "registered_farm" | "corporation" | null;
  description: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
  plan: "free" | "breeder" | "pro";
  totalSales: number;
  totalListings: number;
  avgRating: number;
  ratingCount: number;
  responseRate: number;
  responseTime: number;
  farmProvince: string | null;
  farmCity: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
