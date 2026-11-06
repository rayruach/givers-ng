export type GiftStatus = "available" | "pending" | "claimed" | "removed";
export type ApplicationStatus = "pending" | "selected" | "rejected" | "paid";
export type NotificationType = "selected" | "rejected" | "applied" | "paid";

export interface Gift {
  id: number;
  userId?: number | null;
  title: string;
  category: string;
  condition: string;
  city: string;
  area: string;
  donor: string;
  donorPhone?: string;
  isAnonymous?: boolean;
  description: string;
  image: string;
  images: string[];
  timeAgo: string;
  status: GiftStatus;
  createdAt?: number;
  applicationCount?: number;
}

export interface Application {
  id: number;
  giftId: number;
  userId: number;
  reason: string;
  delivery: string;
  status: ApplicationStatus;
  paystackRef?: string | null;
  createdAt: number;
  // joined fields
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  giftTitle?: string;
}

export interface AppNotification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  giftId?: number | null;
  appId?: number | null;
  read: boolean;
  createdAt: number;
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
