import type { BlogPost } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

const TITLES = [
  "Designing for Calm Density",
  "Why Editorial Layouts Win Trust",
  "Inside Rivera's Token System",
  "Shipping a Mock-First Admin",
  "From Sketches to Sidebar",
  "Color Theory for Dashboards",
  "Typography Pairings We Love",
  "Motion Without the Noise",
  "Empty States That Convert",
  "A Better Way to Paginate",
  "Building a Command Palette",
  "The Hidden Cost of Toggles",
];

const CATEGORIES = ["Design", "Engineering", "Product", "Culture"];
const STATUSES: BlogPost["status"][] = ["draft", "scheduled", "published", "published", "published", "archived"];

export const mockBlogPosts: BlogPost[] = TITLES.map((title, i) => ({
  id: `post_${i + 1}`,
  title,
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  excerpt: `${title.split(" ").slice(0, 4).join(" ")} — a closer look at the ideas behind it.`,
  authorId: `u_${(i % 6) + 1}`,
  category: CATEGORIES[i % CATEGORIES.length],
  tags: [CATEGORIES[i % CATEGORIES.length].toLowerCase(), "rivera"],
  status: STATUSES[i % STATUSES.length],
  publishedAt: STATUSES[i % STATUSES.length] === "published" ? ago(60 - i * 4) : undefined,
  views: 200 + i * 137,
  comments: i % 9,
  coverUrl: `https://picsum.photos/seed/blog${i + 1}/640/360`,
  createdAt: ago(80 - i * 5),
  updatedAt: ago(i),
}));

export const blogPostsStore = createLocalStore<BlogPost>({
  key: "data:blog-posts",
  seed: mockBlogPosts,
  idPrefix: "post",
});