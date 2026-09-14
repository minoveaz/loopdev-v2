import type { ContactPort } from "../../../../../packages/contracts/src/contact-port";
import { localLoopdevAdapter } from "./local";

export const desktopContactAdapter: ContactPort = {
  listContacts: (params) => localLoopdevAdapter.crm.listContacts(params),
  createContact: (input) => localLoopdevAdapter.crm.createContact(input),
  updateContact: (contactId, patch, expectedUpdatedAt) => localLoopdevAdapter.crm.updateContact(contactId, patch, expectedUpdatedAt),
  archiveContact: (contactId, expectedUpdatedAt) => localLoopdevAdapter.crm.archiveContact(contactId, expectedUpdatedAt),
  getCustomer360: (contactId) => localLoopdevAdapter.crm.getCustomer360(contactId),
  findPotentialDuplicates: (contactId) => localLoopdevAdapter.crm.findPotentialDuplicates(contactId),
  dismissDuplicateReview: (contactId, candidateId, confirmation) => localLoopdevAdapter.crm.dismissDuplicateReview(contactId, candidateId, confirmation),
};