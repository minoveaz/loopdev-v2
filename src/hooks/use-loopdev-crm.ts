import { useEffect, useState } from "react";
import { loopdevAdapter } from "@/adapters/loopdev";
import type { CRMContact, CRMLead, Customer360View } from "@/adapters/loopdev";

export function useLoopdevContacts() {
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void loopdevAdapter.crm.listContacts().then((items) => {
      if (active) {
        setContacts(items);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  return { contacts, loading };
}

export function useLoopdevLeads() {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void loopdevAdapter.crm.listLeads().then((items) => {
      if (active) {
        setLeads(items);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  return { leads, loading };
}

export function useLoopdevCustomer360(contactId: string | undefined) {
  const [view, setView] = useState<Customer360View | null>(null);
  const [loading, setLoading] = useState(Boolean(contactId));

  useEffect(() => {
    let active = true;
    if (!contactId) {
      setView(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void loopdevAdapter.crm.getCustomer360(contactId).then((result) => {
      if (active) {
        setView(result);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [contactId]);

  return { view, loading };
}
