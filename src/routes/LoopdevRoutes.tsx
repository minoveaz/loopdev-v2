import { Fragment, lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const Launchpad = lazy(() => import("@/loopdev/pages/Launchpad"));
const SalesCRM = lazy(() => import("@/loopdev/pages/crm/Overview"));
const SalesCRMContacts = lazy(() => import("@/loopdev/pages/crm/Contacts"));
const SalesCRMLeads = lazy(() => import("@/loopdev/pages/crm/Leads"));
const SalesCRMPipeline = lazy(() => import("@/loopdev/pages/crm/Pipeline"));
const SalesCRMCustomer360 = lazy(() => import("@/loopdev/pages/crm/Customer360"));

export const loopdevRouteElements = (
  <Fragment>
    <Route path="/launchpad" element={<Launchpad />} />
    <Route path="/app/sales-crm" element={<Navigate to="/app/sales-crm/overview" replace />} />
    <Route path="/app/sales-crm/overview" element={<SalesCRM />} />
    <Route path="/app/sales-crm/contacts" element={<SalesCRMContacts />} />
    <Route path="/app/sales-crm/contacts/:contactId" element={<SalesCRMCustomer360 />} />
    <Route path="/app/sales-crm/leads" element={<SalesCRMLeads />} />
    <Route path="/app/sales-crm/pipeline" element={<SalesCRMPipeline />} />
  </Fragment>
);
