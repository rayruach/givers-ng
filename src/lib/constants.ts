export const NG_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa",
  "Benue","Borno","Cross River","Delta","Ebonyi","Edo",
  "Ekiti","Enugu","FCT – Abuja","Gombe","Imo","Jigawa",
  "Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara",
  "Lagos","Nasarawa","Niger","Ogun","Ondo","Osun",
  "Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
] as const;

export const CATEGORIES = [
  "Electronics", "Furniture", "Clothing", "Books",
  "Appliances", "Food & Groceries", "Medical & Health",
  "Baby & Kids Items", "Sports & Fitness", "Tools & Equipment",
  "Beauty & Cosmetics", "Kitchen Items", "Toys & Games",
  "Home & Garden", "Office Supplies",
] as const;

export const CATEGORY_WITH_OTHER = [...CATEGORIES, "Other"] as const;

export const DAILY_CLAIM_LIMIT = 1;
export const MONTHLY_CLAIM_LIMIT = 3;
export const CLAIM_FEE_KOBO   = 100000; // ₦1,000 in kobo
export const CLAIM_FEE_NGN    = 1000;

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
