import { createMobileContactAdapter } from "../../../../apps/mobile/adapters/contact";
import { desktopContactAdapter } from "@/loopdev/domains/crm/adapter/contact";
import { crmCustomersStore } from "@/loopdev/domains/crm/data/localCustomers";
import { contactPortContract } from "./contact-port.contract";

contactPortContract("desktop", () => desktopContactAdapter, () => crmCustomersStore.reset());
contactPortContract("mobile", createMobileContactAdapter);
