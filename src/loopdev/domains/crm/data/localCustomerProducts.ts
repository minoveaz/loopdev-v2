import { createLocalStore } from "@/lib/localStore";
import type { CRMCustomerProduct } from "../adapter/types";

const organizationId = "local-development-organization";

export const localCustomerProductsStore = createLocalStore<CRMCustomerProduct>({
  key: "loopdev:crm:customer-products",
  idPrefix: "crm_customer_product",
  seed: [],
});

export { organizationId as localCustomerProductsOrganizationId };
