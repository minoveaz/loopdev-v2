import type { Category } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

const NAMES = [
  "Apparel", "Footwear", "Electronics", "Home & Living", "Beauty",
  "Sports", "Accessories", "Books", "Toys", "Outdoors", "Jewelry", "Stationery",
];

export const mockCategories: Category[] = NAMES.map((name, i) => ({
  id: `cat_${i + 1}`,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  description: `Curated ${name.toLowerCase()} collection.`,
  productCount: 8 + ((i * 7) % 42),
  isActive: i % 5 !== 4,
  createdAt: ago(120 - i * 3),
  updatedAt: ago(10 + i),
}));

export const categoriesStore = createLocalStore<Category>({
  key: "data:categories",
  seed: mockCategories,
  idPrefix: "cat",
});