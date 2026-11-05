import {
  pgTable, serial, text, integer, timestamp, pgEnum, boolean
} from "drizzle-orm/pg-core";

/* ── Enums ── */
export const giftStatusEnum = pgEnum("gift_status", [
  "available", "pending", "claimed", "removed"
]);

export const claimStatusEnum = pgEnum("claim_status", [
  "paid", "connected", "completed", "refunded"
]);

export const urgencyEnum = pgEnum("urgency", [
  "high", "medium", "low"
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
  description: text("description").notNull().default(""),
  image:       text("image").notNull().default(""),
  images:      text("images").array().notNull().default([]),
  status:      giftStatusEnum("status").notNull().default("available"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
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
  id:       serial("id").primaryKey(),
  name:     text("name").notNull(),
  item:     text("item").notNull(),
  category: text("category").notNull().default("Other"),
  city:     text("city").notNull(),
  urgency:  urgencyEnum("urgency").notNull().default("medium"),
  story:    text("story").notNull().default(""),
  granted:  boolean("granted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ── thank_notes ── */
export const thankNotesTable = pgTable("thank_notes", {
  id:       serial("id").primaryKey(),
  claimId:  integer("claim_id").references(() => claimsTable.id),
  donor:    text("donor").notNull(),
  msg:      text("msg").notNull().default(""),
  rating:   integer("rating").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
