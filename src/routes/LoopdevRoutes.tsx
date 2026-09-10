import { Fragment, lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const Launchpad = lazy(() => import("@/loopdev/pages/Launchpad"));
const Settings = lazy(() => import("@/loopdev/pages/Settings"));
const SalesCRM = lazy(() => import("@/loopdev/pages/crm/Overview"));
const SalesCRMContacts = lazy(() => import("@/loopdev/pages/crm/Contacts"));
const SalesCRMLeads = lazy(() => import("@/loopdev/pages/crm/Leads"));
const SalesCRMPipeline = lazy(() => import("@/loopdev/pages/crm/Pipeline"));
const SalesCRMOpportunities = lazy(() => import("@/loopdev/pages/crm/Opportunities"));
const SalesCRMCustomer360 = lazy(() => import("@/loopdev/pages/crm/Customer360"));
const SalesCRMOperations = lazy(() => import("@/loopdev/pages/crm/Operations"));
const SalesCRMAutomations = lazy(() => import("@/loopdev/pages/crm/Automations"));
const SalesCRMCommunications = lazy(() => import("@/loopdev/pages/crm/Communications"));
const PlatformWorkspace = lazy(() => import("@/loopdev/pages/platform/Workspace"));
const TaskTemplates = lazy(() => import("@/loopdev/pages/platform/TaskTemplates"));

export const loopdevRouteElements = (
  <Fragment>
    <Route path="/launchpad" element={<Launchpad />} />
    <Route path="/app/settings" element={<Settings />} />
    <Route path="/app/settings/crm/operations" element={<SalesCRMOperations />} />
    <Route path="/app/settings/crm/automations" element={<SalesCRMAutomations />} />
    <Route path="/app/settings/data/operations" element={<SalesCRMOperations />} />
    <Route path="/app/sales-crm" element={<Navigate to="/app/sales-crm/overview" replace />} />
    <Route path="/app/sales-crm/overview" element={<SalesCRM />} />
    <Route path="/app/sales-crm/contacts" element={<SalesCRMContacts />} />
    <Route path="/app/sales-crm/contacts/:contactId" element={<SalesCRMCustomer360 />} />
    <Route path="/app/sales-crm/leads" element={<SalesCRMLeads />} />
    <Route path="/app/sales-crm/pipeline" element={<SalesCRMPipeline />} />
    <Route path="/app/sales-crm/opportunities" element={<SalesCRMOpportunities />} />
    <Route path="/app/sales-crm/operations" element={<Navigate to="/app/settings/crm/operations" replace />} />
    <Route path="/app/sales-crm/automations" element={<Navigate to="/app/settings/crm/automations" replace />} />
    <Route path="/app/sales-crm/communications" element={<SalesCRMCommunications />} />
    <Route path="/app/sales-crm/communications/:conversationId" element={<SalesCRMCommunications />} />
    <Route path="/app/sales-crm/tasks" element={<PlatformWorkspace />} />
    <Route path="/app/sales-crm/task-templates" element={<TaskTemplates />} />
  </Fragment>
);
