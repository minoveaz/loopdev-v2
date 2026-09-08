/** Barrel — convenient imports for all mock data and stores. */

export * from "./_seedHelpers";

export { mockUsers, usersStore } from "./mockUsers";
export { mockRoles, rolesStore } from "./mockRoles";
export { mockProjects, projectsStore } from "./mockProjects";
export { mockTasks, tasksStore } from "./mockTasks";
export { mockOrders, ordersStore } from "./mockOrders";
export { mockProducts, productsStore } from "./mockProducts";
export { mockInvoices, invoicesStore } from "./mockInvoices";
export { mockNotifications, notificationsStore } from "./mockNotifications";
export { mockMessages, messagesStore } from "./mockMessages";
export { mockActivity, activityStore } from "./mockActivity";
export { mockCalendarEvents, calendarStore } from "./mockCalendar";
export { mockFiles, filesStore, STORAGE_LIMIT, formatBytes, type FileItem, type FileKind } from "./mockFiles";

export { mockCategories, categoriesStore } from "./mockCategories";
export { mockCustomers, customersStore } from "./mockCustomers";
export { mockKanbanColumns, kanbanColumnsStore } from "./mockKanban";
export { mockPosTransactions, posStore } from "./mockPos";
export {
  mockNftAssets, nftStore,
  mockNftBids, nftBidsStore,
  mockNftCreators, nftCreatorsStore,
  mockNftCollections, nftCollectionsStore,
  type NftBid, type NftCreator, type NftCollection,
} from "./mockNft";
export {
  mockShipments, shipmentsStore,
  mockVehicles, vehiclesStore,
  mockWarehouses, warehousesStore,
} from "./mockLogistics";
export {
  mockListings, listingsStore,
  mockDeals, dealsStore,
  mockAgents, agentsStore,
} from "./mockRealEstate";
export { mockCampaigns, campaignsStore } from "./mockMarketing";
export {
  mockCourses, coursesStore,
  mockInstructors, instructorsStore,
  mockLearners, learnersStore,
} from "./mockAcademy";
export { mockBlogPosts, blogPostsStore } from "./mockBlogs";
export { mockSubscriptionPlans, subscriptionPlansStore } from "./mockSubscriptions";
export { mockTickets, ticketsStore } from "./mockTickets";
export { mockTimeEntries, timeEntriesStore } from "./mockTime";
export { mockEmails, emailsStore } from "./mockEmails";
export { mockMeetings, meetingsStore } from "./mockMeetings";

export {
  salesByMonth,
  salesByCategory,
  revenueSeries,
  trafficByDay,
  visitorsSeries,
  channelBreakdown,
  topPages,
} from "./mockMetrics";
