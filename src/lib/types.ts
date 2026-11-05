export type GiftStatus = "available" | "pending" | "claimed" | "removed";

export interface Gift {
  id: number;
  title: string;
  category: string;
  condition: string;
  city: string;
  area: string;
  donor: string;
  donorPhone?: string;
  description: string;
  image: string;
  images: string[];
  timeAgo: string;
  status: GiftStatus;
  createdAt?: number;
}

export interface Wish {
  id: number;
  name: string;
  item: string;
  category: string;
  city: string;
  urgency: "high" | "medium" | "low";
  story: string;
  timeAgo: string;
  granted?: boolean;
}

export interface ThankNote {
  id: number;
  donor: string;
  msg: string;
  rating: number;
  time: string;
}

export type ClaimRecord = {
  id: number;
  giftId: number;
  giftTitle: string;
  claimerName: string;
  claimerEmail: string;
  claimerPhone: string;
  paystackRef: string;
  delivery: string;
  status: "paid" | "connected" | "completed" | "refunded";
  createdAt: number;
};

export type Tab = "gifts" | "wishes" | "donors" | "profile";
