import {
  pgTable, serial, text, integer, timestamp, pgEnum, boolean
} from "drizzle-orm/pg-core";

/* ── Enums ── */
export const giftStatusEnum = pgEnum("gift_status", [
  "available", "pending", "claimed", "removed",
]);

export const claimStatusEnum = pgEnum("claim_status", [
  "paid", "connected", "completed", "refunded",
]);

export const urgencyEnum = pgEnum("urgency", [
  "high", "medium", "low",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "pending",   // submitted, giver reviewing
  "selected",  // giver chose this applicant — awaiting payment
  "rejected",  // giver passed
  "paid",      // receiver paid ₦1,000
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "selected",  // receiver: you were selected
  "rejected",  // receiver: not chosen
  "applied",   // giver: someone applied for your gift
  "paid",      // giver: selected receiver has paid
]);

export const refundStatusEnum = pgEnum("refund_status", [
  "pending",   // submitted, admin reviewing
  "approved",  // admin approved, processing refund
  "rejected",  // admin denied
  "completed", // refund sent
]);

/* ── users ── */
export const usersTable = pgTable("users", {
  id:        serial("id").primaryKey(),
  name:      text("name").notNull(),
  email:     text("email").notNull().unique(),
  phone:     text("phone").notNull().default(""),
  password:  text("password").notNull(),
  blocked:   boolean("blocked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ── gifts ── */
export const giftsTable = pgTable("gifts", {
  id:          serial("id").primaryKey(),
  userId:      integer("user_id"),
  title:       text("title").notNull(),
  category:    text("category").notNull(),
  condition:   text("condition").notNull().default("Gently Used"),
  city:        text("city").notNull(),
  area:        text("area").notNull().default(""),
  donor:       text("donor").notNull(),
  donorPhone:  text("donor_phone"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  description: text("description").notNull().default(""),
  image:       text("image").notNull().default(""),
  images:      text("images").array().notNull().default([]),
  status:      giftStatusEnum("status").notNull().default("available"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
});

/* ── applications ── */
export const applicationsTable = pgTable("applications", {
  id:          serial("id").primaryKey(),
  giftId:      integer("gift_id").notNull().references(() => giftsTable.id),
  userId:      integer("user_id").notNull().references(() => usersTable.id),
  reason:      text("reason").notNull(),
  delivery:    text("delivery").notNull().default("pickup"),
  status:      applicationStatusEnum("status").notNull().default("pending"),
  paystackRef: text("paystack_ref"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
});

/* ── notifications ── */
export const notificationsTable = pgTable("notifications", {
  id:        serial("id").primaryKey(),
  userId:    integer("user_id").notNull().references(() => usersTable.id),
  type:      notificationTypeEnum("type").notNull(),
  title:     text("title").notNull(),
  message:   text("message").notNull(),
  giftId:    integer("gift_id"),
  appId:     integer("app_id"),
  read:      boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ── claims ── */
export const claimsTable = pgTable("claims", {
  id:            serial("id").primaryKey(),
  giftId:        integer("gift_id").notNull().references(() => giftsTable.id),
  giftTitle:     text("gift_title").notNull(),
  claimerName:   text("claimer_name").notNull(),
  claimerEmail:  text("claimer_email").notNull(),
  claimerPhone:  text("claimer_phone").notNull().default(""),
  paystackRef:   text("paystack_ref").notNull(),
  delivery:      text("delivery").notNull().default("pickup"),
  status:        claimStatusEnum("status").notNull().default("paid"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
});

/* ── wishes ── */
export const wishesTable = pgTable("wishes", {
  id:        serial("id").primaryKey(),
  name:      text("name").notNull(),
  item:      text("item").notNull(),
  category:  text("category").notNull().default("Other"),
  city:      text("city").notNull(),
  urgency:   urgencyEnum("urgency").notNull().default("medium"),
  story:     text("story").notNull().default(""),
  granted:   boolean("granted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ── thank_notes ── */
export const thankNotesTable = pgTable("thank_notes", {
  id:        serial("id").primaryKey(),
  claimId:   integer("claim_id").references(() => claimsTable.id),
  donor:     text("donor").notNull(),
  msg:       text("msg").notNull().default(""),
  rating:    integer("rating").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ── refund_requests ── */
export const refundRequestsTable = pgTable("refund_requests", {
  id:          serial("id").primaryKey(),
  userId:      integer("user_id").notNull().references(() => usersTable.id),
  claimId:     integer("claim_id").references(() => claimsTable.id),
  appId:       integer("app_id").references(() => applicationsTable.id),
  giftTitle:   text("gift_title").notNull(),
  reason:      text("reason").notNull(),
  paystackRef: text("paystack_ref"),
  amount:      integer("amount").notNull().default(1000),
  status:      refundStatusEnum("status").notNull().default("pending"),
  adminNote:   text("admin_note"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
});
