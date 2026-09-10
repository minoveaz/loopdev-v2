import { useEffect, useState } from "react";
import { loopdevAdapter } from "../adapter";
import type {
  CRMAutomation,
  CRMCreateAutomationInput,
  CRMEmitEventInput,
  CRMExecutionLog,
} from "../automations";

export function useCrmAutomations(organizationId = "local-development-organization") {
  const [automations, setAutomations] = useState<CRMAutomation[]>([]);
  const [executionLog, setExecutionLog] = useState<CRMExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([
      loopdevAdapter.crm.automations.list(organizationId),
      loopdevAdapter.crm.automations.listExecutionLog({ organizationId }),
    ]).then(([items, logs]) => {
      if (active) {
        setAutomations(items);
        setExecutionLog(logs);
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Please try again.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [organizationId, reloadToken]);

  const run = async <T,>(action: () => Promise<T>) => {
    try {
      const result = await action();
      setReloadToken((token) => token + 1);
      return result;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
      throw cause;
    }
  };

  return {
    automations,
    executionLog,
    loading,
    error,
    createAutomation: (input: Omit<CRMCreateAutomationInput, "organizationId">) =>
      run(() => loopdevAdapter.crm.automations.create({ ...input, organizationId })),
    emitEvent: (input: Omit<CRMEmitEventInput, "organizationId">) =>
      run(() => loopdevAdapter.crm.automations.emitEvent({ ...input, organizationId })),
    toggleAutomation: (automation: CRMAutomation) =>
      run(() => loopdevAdapter.crm.automations.update(automation.id, organizationId, { active: !automation.active })),
    reload: () => setReloadToken((token) => token + 1),
  };
}

