/**
 * Rivera shared types — single source of truth for the mock data layer.
 * Every persisted entity extends `Entity`.
 */

export interface Entity {
  id: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/* ------------------------------------------------------------------ */
/* Users & Roles                                                       */
/* ------------------------------------------------------------------ */

export type UserStatus = "active" | "pending" | "suspended" | "archived";

export interface User extends Entity {
  name: string;
  email: string;
  roleId: string;        // FK -> Role.id
  status: UserStatus;
  avatarUrl?: string;
  title?: string;
  department?: string;
  lastActiveAt: string;
}

export type Permission =
  | "users.read"
  | "users.write"
  | "projects.read"
  | "projects.write"
  | "billing.read"
  | "billing.write"
  | "reports.read"
  | "settings.write"
  | "*";

export interface Role extends Entity {
  name: string;
  slug: string;
  description: string;
  permissions: Permission[];
  memberCount: number;
  isSystem: boolean;
}

/* ------------------------------------------------------------------ */
/* Projects & Tasks                                                    */
/* ------------------------------------------------------------------ */

export type ProjectStatus = "in_progress" | "completed" | "on_hold" | "cancelled" | "planned";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Project extends Entity {
  name: string;
  client: string;
  description: string;
  progress: number;             // 0..100
  budget: number;
  spent: number;
  currency: Currency;
  status: ProjectStatus;
  priority: Priority;
  startDate: string;
  dueDate: string;
  ownerId: string;              // FK -> User.id
  memberIds: string[];          // FK -> User.id[]
  tags: string[];
}

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done" | "blocked";

export interface Task extends Entity {
  title: string;
  description?: string;
  projectId: string;            // FK -> Project.id
  assigneeId?: string;          // FK -> User.id
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  tags: string[];
  /** Subtasks completion: [completed, total] */
  checklist: [number, number];
}

export interface TimeEntry extends Entity {
  projectId: string;
  taskId?: string;
  userId: string;
  date: string;          // ISO date
  hours: number;
  billable: boolean;
  note: string;
}

export type EmailFolder = "inbox" | "sent" | "drafts" | "starred" | "archive" | "trash";

export interface Email extends Entity {
  from: { name: string; email: string };
  to: string;
  subject: string;
  preview: string;
  body: string;
  folder: EmailFolder;
  read: boolean;
  starred: boolean;
  labels: string[];
}

export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface Meeting extends Entity {
  title: string;
  description: string;
  hostId: string;
  participants: string[];   // user IDs
  startsAt: string;
  durationMinutes: number;
  link: string;
  status: MeetingStatus;
  tag: string;
}

/* ------------------------------------------------------------------ */
/* Commerce: Orders, Products, Invoices                                */
/* ------------------------------------------------------------------ */

export type Currency = "USD" | "EUR" | "GBP";
export type OrderStatus = "paid" | "pending" | "refunded" | "failed" | "shipped" | "cancelled";

export interface Order extends Entity {
  reference: string;
  customer: string;
  customerEmail: string;
  amount: number;
  currency: Currency;
  status: OrderStatus;
  items: number;
  paymentMethod: "card" | "wire" | "paypal" | "credit";
}

export type ProductStatus = "active" | "draft" | "archived" | "out_of_stock";

export interface Product extends Entity {
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: Currency;
  stock: number;
  status: ProductStatus;
  rating: number;               // 0..5
  sales: number;                // unit count
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice extends Entity {
  number: string;               // e.g. INV-2026-0042
  customer: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: Currency;
  subtotal: number;
  tax: number;
  total: number;
  lines: InvoiceLine[];
}

/* ------------------------------------------------------------------ */
/* Notifications & Messages                                            */
/* ------------------------------------------------------------------ */

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification extends Entity {
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
}

export interface Message extends Entity {
  threadId: string;
  fromUserId: string;
  toUserId: string;
  preview: string;
  body: string;
  read: boolean;
  starred: boolean;
}

/* ------------------------------------------------------------------ */
/* Activity logs                                                       */
/* ------------------------------------------------------------------ */

export type ActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "logged_in"
  | "logged_out"
  | "invited"
  | "exported"
  | "uploaded"
  | "commented";

export interface ActivityLog extends Entity {
  actorId: string;              // FK -> User.id
  action: ActivityAction;
  entity: string;               // e.g. "project", "order"
  entityId: string;
  summary: string;
  metadata?: Record<string, string | number>;
}

/* ------------------------------------------------------------------ */
/* Analytics                                                           */
/* ------------------------------------------------------------------ */

export interface MetricPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface SalesPoint extends MetricPoint {
  /** Period label (e.g. "Nov", "Dec"). */
  label: string;
  /** Revenue this period. */
  value: number;
  /** Revenue previous period. */
  secondary?: number;
  orders: number;
  refunds: number;
}

export interface TrafficPoint extends MetricPoint {
  visitors: number;
  pageViews: number;
  bounceRate: number;
}

export interface ChannelShare {
  label: string;
  value: number;                // percent share
}

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

export type EventCategory = "meeting" | "deadline" | "release" | "holiday" | "personal";

export interface CalendarEvent extends Entity {
  title: string;
  description?: string;
  start: string;                // ISO
  end: string;                  // ISO
  allDay: boolean;
  category: EventCategory;
  location?: string;
  attendeeIds: string[];        // FK -> User.id[]
}

/* ------------------------------------------------------------------ */
/* Auth session (kept for back-compat with existing useAuth hook)      */
/* ------------------------------------------------------------------ */

export interface AuthSession {
  email: string;
  name: string;
  role: string;
  signedInAt: string;
}

/* ------------------------------------------------------------------ */
/* Catalog: Categories & Customers                                     */
/* ------------------------------------------------------------------ */

export interface Category extends Entity {
  name: string;
  slug: string;
  description: string;
  parentId?: string;
  productCount: number;
  isActive: boolean;
}

export type CustomerTier = "lead" | "standard" | "vip" | "wholesale";

export interface Customer extends Entity {
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  totalSpent: number;
  currency: Currency;
  ordersCount: number;
  tier: CustomerTier;
  avatarUrl?: string;
  lastOrderAt: string;
}

/* ------------------------------------------------------------------ */
/* Kanban                                                              */
/* ------------------------------------------------------------------ */

export interface KanbanColumn extends Entity {
  boardId: string;
  title: string;
  color: string;
  order: number;
  taskIds: string[];
}

/* ------------------------------------------------------------------ */
/* POS                                                                 */
/* ------------------------------------------------------------------ */

export type PosPaymentMethod = "cash" | "card" | "wallet" | "voucher";
export type PosStatus = "completed" | "voided" | "refunded" | "pending";

export interface PosLineItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PosTransaction extends Entity {
  reference: string;
  cashier: string;
  registerId: string;
  items: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: Currency;
  payment: PosPaymentMethod;
  status: PosStatus;
  lineItems?: PosLineItem[];
  discount?: number;
  customerId?: string;
  customerName?: string;
}

/* ------------------------------------------------------------------ */
/* NFT                                                                 */
/* ------------------------------------------------------------------ */

export type NftStatus = "listed" | "auction" | "sold" | "draft";

export interface NftAsset extends Entity {
  name: string;
  collection: string;
  creator: string;
  imageUrl: string;
  price: number;
  currency: "ETH" | "SOL" | "USDC";
  highestBid?: number;
  status: NftStatus;
  likes: number;
  views: number;
}

/* ------------------------------------------------------------------ */
/* Logistics                                                           */
/* ------------------------------------------------------------------ */

export type ShipmentStatus = "pending" | "in_transit" | "delivered" | "delayed" | "cancelled";

export interface Shipment extends Entity {
  trackingNumber: string;
  origin: string;
  destination: string;
  carrier: string;
  weightKg: number;
  status: ShipmentStatus;
  etaDate: string;
  customer: string;
  vehicleId?: string;
}

export type VehicleStatus = "active" | "maintenance" | "idle" | "retired";

export interface Vehicle extends Entity {
  plate: string;
  model: string;
  type: "van" | "truck" | "bike" | "car";
  driver: string;
  capacityKg: number;
  status: VehicleStatus;
  mileageKm: number;
  lastServiceAt: string;
}

export interface Warehouse extends Entity {
  name: string;
  code: string;
  city: string;
  country: string;
  capacity: number;
  occupancy: number; // 0..100
  manager: string;
  isActive: boolean;
}

/* ------------------------------------------------------------------ */
/* Real Estate                                                         */
/* ------------------------------------------------------------------ */

export type ListingStatus = "available" | "pending" | "sold" | "rented" | "off_market";
export type PropertyType = "apartment" | "house" | "villa" | "office" | "land";

export interface RealEstateListing extends Entity {
  title: string;
  address: string;
  city: string;
  type: PropertyType;
  price: number;
  currency: Currency;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  status: ListingStatus;
  agentId: string;
  imageUrl: string;
}

export type DealStage = "new" | "viewing" | "negotiation" | "closed_won" | "closed_lost";

export interface RealEstateDeal extends Entity {
  listingId: string;
  client: string;
  agentId: string;
  amount: number;
  currency: Currency;
  stage: DealStage;
  expectedCloseDate: string;
  notes?: string;
}

export interface Agent extends Entity {
  name: string;
  email: string;
  phone: string;
  region: string;
  listingsCount: number;
  closedDeals: number;
  rating: number; // 0..5
  avatarUrl?: string;
}

/* ------------------------------------------------------------------ */
/* Marketing                                                           */
/* ------------------------------------------------------------------ */

export type CampaignStatus = "draft" | "scheduled" | "running" | "paused" | "completed";
export type CampaignChannel = "email" | "social" | "search" | "display" | "sms";

export interface Campaign extends Entity {
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  budget: number;
  spent: number;
  currency: Currency;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate: string;
}

/* ------------------------------------------------------------------ */
/* Academy                                                             */
/* ------------------------------------------------------------------ */

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published" | "archived";

export interface Course extends Entity {
  title: string;
  category: string;
  level: CourseLevel;
  status: CourseStatus;
  instructorId: string;
  durationMinutes: number;
  lessons: number;
  enrolled: number;
  rating: number;
  price: number;
  currency: Currency;
}

export interface Instructor extends Entity {
  name: string;
  email: string;
  expertise: string;
  coursesCount: number;
  studentsCount: number;
  rating: number;
  avatarUrl?: string;
}

export interface Learner extends Entity {
  name: string;
  email: string;
  enrolledCourses: number;
  completedCourses: number;
  progress: number; // 0..100
  lastActiveAt: string;
  avatarUrl?: string;
}

/* ------------------------------------------------------------------ */
/* Blogs                                                               */
/* ------------------------------------------------------------------ */

export type BlogStatus = "draft" | "scheduled" | "published" | "archived";

export interface BlogPost extends Entity {
  title: string;
  slug: string;
  excerpt: string;
  authorId: string;
  category: string;
  tags: string[];
  status: BlogStatus;
  publishedAt?: string;
  views: number;
  comments: number;
  coverUrl?: string;
}

/* ------------------------------------------------------------------ */
/* Subscriptions                                                       */
/* ------------------------------------------------------------------ */

export type PlanInterval = "monthly" | "yearly";

export interface SubscriptionPlan extends Entity {
  name: string;
  description: string;
  price: number;
  currency: Currency;
  interval: PlanInterval;
  features: string[];
  isPopular: boolean;
  activeSubscribers: number;
}

/* ------------------------------------------------------------------ */
/* Helpdesk                                                            */
/* ------------------------------------------------------------------ */

export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface Ticket extends Entity {
  reference: string;
  subject: string;
  description: string;
  requester: string;
  requesterEmail: string;
  assigneeId?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  lastReplyAt: string;
}

/* ------------------------------------------------------------------ */
/* Generic query types                                                  */
/* ------------------------------------------------------------------ */

export type SortDirection = "asc" | "desc";

export interface SortSpec<T> {
  key: keyof T;
  direction: SortDirection;
}

export interface QueryOptions<T> {
  search?: string;
  /** Keys to search across. Defaults to all string fields. */
  searchKeys?: (keyof T)[];
  /** Equality filter map: { status: "paid", currency: ["USD", "EUR"] } */
  filters?: Partial<Record<keyof T, unknown | unknown[]>>;
  sort?: SortSpec<T>;
  page?: number;
  pageSize?: number;
}
