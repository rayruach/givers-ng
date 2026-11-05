export const NG_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa",
  "Benue","Borno","Cross River","Delta","Ebonyi","Edo",
  "Ekiti","Enugu","FCT – Abuja","Gombe","Imo","Jigawa",
  "Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara",
  "Lagos","Nasarawa","Niger","Ogun","Ondo","Osun",
  "Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
] as const;

export const CATEGORIES = ["Electronics","Furniture","Clothing","Books","Appliances"] as const;

export const DAILY_CLAIM_LIMIT = 2;
export const CLAIM_FEE_KOBO   = 50000; // ₦500 in kobo
export const CLAIM_FEE_NGN    = 500;

export const MOSAIC_IMAGES = [
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=300&q=80",
  "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=300&q=80",
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=300&q=80",
  "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=300&q=80",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&q=80",
  "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=300&q=80",
  "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=300&q=80",
  "https://images.unsplash.com/photo-1524069290683-0457abfe42c3?w=300&q=80",
  "https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=300&q=80",
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=300&q=80",
  "https://images.unsplash.com/photo-1517456793572-1d8efd6dc135?w=300&q=80",
  "https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?w=300&q=80",
  "https://images.unsplash.com/photo-1609156927756-d50ddd3b3d76?w=300&q=80",
  "https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=300&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&q=80",
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=300&q=80",
  "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=300&q=80",
  "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=300&q=80",
  "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=300&q=80",
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=300&q=80",
];

export const SAMPLE_GIFTS = [
  {
    id: 1, title: "LG Standing Fan 16 Inch", category: "Appliances",
    condition: "Like New", city: "Lagos", area: "Ikeja GRA", donor: "Aunty Blessing",
    description: "Barely used, perfect working condition. Pickup only from Ikeja GRA.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"],
    timeAgo: "2h ago", status: "available" as const, createdAt: Date.now() - 7200000,
  },
  {
    id: 2, title: "Samsung Galaxy Tab A7", category: "Electronics",
    condition: "Gently Used", city: "Abuja", area: "Wuse 2", donor: "Brother Chukwu",
    description: "Works perfectly. Comes with charger. Great for students.",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80"],
    timeAgo: "5h ago", status: "available" as const, createdAt: Date.now() - 18000000,
  },
  {
    id: 3, title: "Children's Story Books (Set of 12)", category: "Books",
    condition: "Gently Used", city: "Enugu", area: "GRA", donor: "Mrs. Okonkwo",
    description: "Age 4-10. Perfect for a family that loves reading.",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80"],
    timeAgo: "1d ago", status: "available" as const, createdAt: Date.now() - 86400000,
  },
  {
    id: 4, title: "Office Chair (Ergonomic)", category: "Furniture",
    condition: "Fair", city: "Lagos", area: "Lekki Phase 1", donor: "Tunde F.",
    description: "Slight scratch on armrest, otherwise solid. Great for a home office.",
    image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=80"],
    timeAgo: "3h ago", status: "available" as const, createdAt: Date.now() - 10800000,
  },
  {
    id: 5, title: "Ladies Blazer Size M", category: "Clothing",
    condition: "Like New", city: "Port Harcourt", area: "Trans Amadi", donor: "Gift A.",
    description: "Wore once. Clean, ironed and ready. Navy blue.",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80"],
    timeAgo: "6h ago", status: "available" as const, createdAt: Date.now() - 21600000,
  },
];
