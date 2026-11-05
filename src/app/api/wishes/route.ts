import { NextResponse } from "next/server";
import { Wish } from "@/lib/types";

export let wishes: Wish[] = [
  {
    id: 1, name: "Adaeze O.", item: "School Backpack for my son",
    category: "Clothing", city: "Enugu", urgency: "high",
    story: "My son starts JSS1 next week and we can't afford a bag. He has been carrying books in a nylon bag.",
    timeAgo: "1h ago", granted: false,
  },
  {
    id: 2, name: "Emeka D.", item: "Working Laptop or Desktop",
    category: "Electronics", city: "Lagos", urgency: "medium",
    story: "I just got a remote job offer but I have no computer. Any laptop that can browse and use Google Docs will do.",
    timeAgo: "3h ago", granted: false,
  },
];

export async function GET() {
  return NextResponse.json({ wishes });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, item, category, city, urgency, story } = body;

  if (!name || !item || !city) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const wish: Wish = {
    id: Date.now(), name, item,
    category: category ?? "Other",
    city, urgency: urgency ?? "medium",
    story: story ?? "",
    timeAgo: "just now", granted: false,
  };

  wishes = [wish, ...wishes];
  return NextResponse.json({ wish }, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, granted } = body as { id: number; granted: boolean };

  const idx = wishes.findIndex((w) => w.id === id);
  if (idx === -1) return NextResponse.json({ error: "Wish not found" }, { status: 404 });

  wishes[idx] = { ...wishes[idx], granted };
  return NextResponse.json({ wish: wishes[idx] });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  wishes = wishes.filter((w) => w.id !== id);
  return NextResponse.json({ success: true });
}
