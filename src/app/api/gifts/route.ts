import { NextResponse } from "next/server";
import { SAMPLE_GIFTS } from "@/lib/constants";
import { Gift, GiftStatus } from "@/lib/types";

// In-memory store — replace with Prisma + DB in production
export let gifts: Gift[] = [...SAMPLE_GIFTS];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category  = searchParams.get("category");
  const state     = searchParams.get("state");
  const status    = searchParams.get("status"); // "available" | "all"
  const adminMode = searchParams.get("admin") === "1";

  let results = gifts;

  // Public feed only shows available gifts unless admin
  if (!adminMode) {
    results = results.filter((g) => g.status === "available");
  }
  if (status && status !== "all") {
    results = results.filter((g) => g.status === status);
  }
  if (category && category !== "All") {
    results = results.filter((g) => g.category === category);
  }
  if (state && state !== "all") {
    results = results.filter((g) => g.city === state);
  }

  return NextResponse.json({ gifts: results });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, category, condition, city, area, donor, description, image, images } = body;

  if (!title || !category || !city || !donor) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const newGift: Gift = {
    id: Date.now(),
    title,
    category,
    condition: condition ?? "Gently Used",
    city,
    area: area ?? "",
    donor,
    description: description ?? "",
    image: image ?? `https://placehold.co/600x400/f9f0eb/f02d6a?text=${encodeURIComponent(title)}`,
    images: images ?? (image ? [image] : []),
    timeAgo: "just now",
    status: "available",
    createdAt: Date.now(),
  };

  gifts = [newGift, ...gifts];
  return NextResponse.json({ gift: newGift }, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, status } = body as { id: number; status: GiftStatus };

  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const idx = gifts.findIndex((g) => g.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }

  gifts[idx] = { ...gifts[idx], status };
  return NextResponse.json({ gift: gifts[idx] });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  gifts = gifts.filter((g) => g.id !== id);
  return NextResponse.json({ success: true });
}
