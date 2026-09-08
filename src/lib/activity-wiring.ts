/**
 * Auto-log CRUD operations from major stores into the activity log.
 * Mutates each store's create/update/remove in place. Imported once at app boot.
 */
import type { Entity } from "@/types";
import type { LocalStore } from "./localStore";
import { activityStore } from "@/data/mockActivity";
import { logActivity } from "./activity";
import {
  usersStore, rolesStore, projectsStore, tasksStore, ordersStore, productsStore,
  invoicesStore, categoriesStore, customersStore, calendarStore, filesStore,
  nftStore, shipmentsStore, vehiclesStore, warehousesStore,
  listingsStore, dealsStore, agentsStore, campaignsStore,
  coursesStore, instructorsStore, learnersStore, blogPostsStore,
  subscriptionPlansStore, ticketsStore, timeEntriesStore, emailsStore, meetingsStore,
  posStore,
} from "@/data";

type AnyStore = LocalStore<Entity>;

const wired = new WeakSet<object>();

function summary(label: string, item: Entity): string {
  const rec = item as unknown as Record<string, unknown>;
  const name = rec.name ?? rec.title ?? rec.subject ?? rec.reference ?? rec.email ?? item.id;
  return `${label} — ${String(name)}`;
}

export function attachActivity(store: AnyStore, entity: string, label: string) {
  if (wired.has(store)) return;
  wired.add(store);
  // Skip self-wiring on the activity store
  if (store === (activityStore as unknown as AnyStore)) return;

  const origCreate = store.create.bind(store);
  const origUpdate = store.update.bind(store);
  const origRemove = store.remove.bind(store);

  store.create = ((input: Parameters<typeof origCreate>[0]) => {
    const item = origCreate(input);
    logActivity({ action: "created", entity, entityId: item.id, summary: summary(`Created ${label}`, item), toastOptions: { title: `${cap(label)} created` } });
    return item;
  }) as typeof store.create;

  store.update = ((id: string, patch: Parameters<typeof origUpdate>[1]) => {
    const item = origUpdate(id, patch);
    if (item) logActivity({ action: "updated", entity, entityId: item.id, summary: summary(`Updated ${label}`, item), toastOptions: { title: `${cap(label)} updated` } });
    return item;
  }) as typeof store.update;

  store.remove = ((id: string) => {
    const prev = store.get(id);
    const ok = origRemove(id);
    if (ok && prev) logActivity({ action: "deleted", entity, entityId: id, summary: summary(`Deleted ${label}`, prev), toastOptions: { title: `${cap(label)} deleted` } });
    return ok;
  }) as typeof store.remove;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function wireActivityLogging() {
  const map: Array<[AnyStore, string, string]> = [
    [usersStore as unknown as AnyStore, "user", "user"],
    [rolesStore as unknown as AnyStore, "role", "role"],
    [projectsStore as unknown as AnyStore, "project", "project"],
    [tasksStore as unknown as AnyStore, "task", "task"],
    [ordersStore as unknown as AnyStore, "order", "order"],
    [productsStore as unknown as AnyStore, "product", "product"],
    [invoicesStore as unknown as AnyStore, "invoice", "invoice"],
    [categoriesStore as unknown as AnyStore, "category", "category"],
    [customersStore as unknown as AnyStore, "customer", "customer"],
    [calendarStore as unknown as AnyStore, "event", "calendar event"],
    [filesStore as unknown as AnyStore, "file", "file"],
    [nftStore as unknown as AnyStore, "nft", "NFT asset"],
    [shipmentsStore as unknown as AnyStore, "shipment", "shipment"],
    [vehiclesStore as unknown as AnyStore, "vehicle", "vehicle"],
    [warehousesStore as unknown as AnyStore, "warehouse", "warehouse"],
    [listingsStore as unknown as AnyStore, "listing", "listing"],
    [dealsStore as unknown as AnyStore, "deal", "deal"],
    [agentsStore as unknown as AnyStore, "agent", "agent"],
    [campaignsStore as unknown as AnyStore, "campaign", "campaign"],
    [coursesStore as unknown as AnyStore, "course", "course"],
    [instructorsStore as unknown as AnyStore, "instructor", "instructor"],
    [learnersStore as unknown as AnyStore, "learner", "learner"],
    [blogPostsStore as unknown as AnyStore, "post", "blog post"],
    [subscriptionPlansStore as unknown as AnyStore, "plan", "subscription plan"],
    [ticketsStore as unknown as AnyStore, "ticket", "ticket"],
    [timeEntriesStore as unknown as AnyStore, "time_entry", "time entry"],
    [emailsStore as unknown as AnyStore, "email", "email"],
    [meetingsStore as unknown as AnyStore, "meeting", "meeting"],
    [posStore as unknown as AnyStore, "pos_transaction", "POS transaction"],
  ];
  for (const [s, e, l] of map) attachActivity(s, e, l);
}
