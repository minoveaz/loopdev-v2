import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const idPattern = /^[A-Z][A-Z0-9-]+$/;
const platforms = new Set(["shared", "desktop_web", "mobile_web", "ios", "android"]);
const requirementClassifications = new Set(["REQUIRED_MVP", "REQUIRED_FOLLOW_UP", "PLATFORM_REUSE", "OUT_OF_SCOPE"]);
const capabilityClassifications = new Set(["REQUIRED_MVP", "REQUIRED_FOLLOW_UP", "PLATFORM_REUSE", "PLATFORM_EXTENSION", "MODULE_SPECIFIC", "OUT_OF_SCOPE", "OPEN_DECISION"]);
const taskStatuses = new Set(["pending", "ready", "in_progress", "done", "blocked"]);
const evidenceLevels = new Set(["E0_PRESENT", "E1_LINT", "E2_UNIT", "E3_COMPONENT", "E4_JOURNEY", "E5_DEVICE"]);
const parityStatuses = new Set(["verified", "partial", "not_tested", "not_applicable"]);
const operationStatuses = new Set(["implemented", "adapted", "missing", "not_applicable"]);

function duplicateIds(items) {
  const seen = new Set();
  return items.map((item) => item?.id).filter((id) => id && (seen.has(id) || !seen.add(id)));
}

function requireArray(errors, value, label, { nonEmpty = true } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array`);
    return [];
  }
  if (nonEmpty && value.length === 0) errors.push(`${label} must not be empty`);
  return value;
}

function approvedRemoval(changeRequests, type, id) {
  const field = type === "requirement" ? "removed_requirement_ids" : "removed_capability_ids";
  return changeRequests.some((request) => request.status === "approved" && request[field]?.includes(id)
    && request.approved_by && request.approved_at && request.source);
}

function detectTaskCycles(tasks, errors) {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const visiting = new Set();
  const visited = new Set();
  function visit(taskId, path) {
    if (visiting.has(taskId)) {
      errors.push(`task dependency cycle: ${[...path, taskId].join(" -> ")}`);
      return;
    }
    if (visited.has(taskId)) return;
    visiting.add(taskId);
    for (const dependency of taskById.get(taskId)?.dependencies ?? []) visit(dependency, [...path, taskId]);
    visiting.delete(taskId);
    visited.add(taskId);
  }
  for (const task of tasks) visit(task.id, []);
}

export function validateLedger(root, ledger, ledgerFile = "delivery-ledger.json", { stage = "base" } = {}) {
  const errors = [];
  if (ledger.schema_version !== 1) errors.push("schema_version must be 1");
  if (!ledger.suite) errors.push("suite is required");
  if (!ledger.module) errors.push("module is required");
  if (!["draft", "blocked", "approved"].includes(ledger.status)) errors.push(`invalid ledger status "${ledger.status ?? "missing"}"`);
  const productSources = requireArray(errors, ledger.product_sources, "product_sources");
  for (const source of productSources) if (!existsSync(join(root, source))) errors.push(`product source does not exist: ${source}`);

  const requiresDiscoveryScope = ["discovery", "design", "plan"].includes(stage) || ledger.status === "approved";
  const requiresPlan = stage === "plan" || ledger.status === "approved";
  const requirements = requireArray(errors, ledger.requirements, "requirements", { nonEmpty: requiresDiscoveryScope });
  const capabilities = requireArray(errors, ledger.capabilities, "capabilities", { nonEmpty: requiresDiscoveryScope });
  const tasks = requireArray(errors, ledger.tasks, "tasks", { nonEmpty: requiresPlan });
  const changeRequests = requireArray(errors, ledger.change_requests, "change_requests", { nonEmpty: false });
  const blockers = requireArray(errors, ledger.blockers, "blockers", { nonEmpty: false });
  for (const type of [["requirement", requirements], ["capability", capabilities], ["task", tasks]]) {
    for (const id of duplicateIds(type[1])) errors.push(`duplicate ${type[0]} id: ${id}`);
  }

  const requirementById = new Map(requirements.map((requirement) => [requirement.id, requirement]));
  const capabilityById = new Map(capabilities.map((capability) => [capability.id, capability]));
  const taskById = new Map(tasks.map((task) => [task.id, task]));

  for (const requirement of requirements) {
    const label = `requirement ${requirement.id ?? "<missing>"}`;
    if (!idPattern.test(requirement.id ?? "")) errors.push(`${label} has an invalid stable id`);
    if (!requirement.title) errors.push(`${label} requires a title`);
    if (!requirementClassifications.has(requirement.classification)) errors.push(`${label} has invalid classification "${requirement.classification ?? "missing"}"`);
    if (!requirement.source || !existsSync(join(root, requirement.source))) errors.push(`${label} source does not exist: ${requirement.source ?? "missing"}`);
    const requirementPlatforms = requireArray(errors, requirement.platforms, `${label}.platforms`);
    for (const platform of requirementPlatforms) if (!platforms.has(platform)) errors.push(`${label} has invalid platform "${platform}"`);
    requireArray(errors, requirement.acceptance_criteria, `${label}.acceptance_criteria`);
    if (!evidenceLevels.has(requirement.evidence_level)) errors.push(`${label} has invalid evidence_level "${requirement.evidence_level ?? "missing"}"`);
    for (const capabilityId of requireArray(errors, requirement.capability_ids, `${label}.capability_ids`)) {
      const capability = capabilityById.get(capabilityId);
      if (!capability) errors.push(`${label} references unknown capability ${capabilityId}`);
      else if (!capability.requirement_ids?.includes(requirement.id)) errors.push(`${label} -> ${capabilityId} is not reciprocal`);
    }
    for (const platform of requirementPlatforms.filter((value) => value !== "shared")) {
      const covered = requirement.capability_ids?.some((capabilityId) => capabilityById.get(capabilityId)?.platforms?.[platform]?.required);
      if (!covered) errors.push(`${label} has no linked capability requiring platform ${platform}`);
    }
  }

  for (const capability of capabilities) {
    const label = `capability ${capability.id ?? "<missing>"}`;
    if (!idPattern.test(capability.id ?? "")) errors.push(`${label} has an invalid stable id`);
    if (!capability.name) errors.push(`${label} requires a name`);
    if (!capabilityClassifications.has(capability.classification)) errors.push(`${label} has invalid classification "${capability.classification ?? "missing"}"`);
    for (const requirementId of requireArray(errors, capability.requirement_ids, `${label}.requirement_ids`)) {
      const requirement = requirementById.get(requirementId);
      if (!requirement) errors.push(`${label} references unknown requirement ${requirementId}`);
      else if (!requirement.capability_ids?.includes(capability.id)) errors.push(`${label} -> ${requirementId} is not reciprocal`);
    }
    const operations = requireArray(errors, capability.semantics?.operations, `${label}.semantics.operations`);
    if (!operations.every((operation) => typeof operation === "string" && operation)) errors.push(`${label} operations must be non-empty strings`);
    requireArray(errors, capability.semantics?.errors, `${label}.semantics.errors`, { nonEmpty: false });
    requireArray(errors, capability.states, `${label}.states`);
    requireArray(errors, capability.permissions, `${label}.permissions`);
    for (const contract of requireArray(errors, capability.contract_refs, `${label}.contract_refs`)) {
      if (!existsSync(join(root, contract))) errors.push(`${label} contract does not exist: ${contract}`);
    }
    for (const platform of ["desktop_web", "mobile_web", "ios", "android"]) {
      const adaptation = capability.platforms?.[platform];
      if (!adaptation || typeof adaptation.required !== "boolean" || !adaptation.surface) errors.push(`${label} requires a ${platform} decision with required and surface`);
    }
    for (const layer of ["domain", "renderer", "operations"]) {
      if (!parityStatuses.has(capability.parity?.[layer])) errors.push(`${label} has invalid ${layer} parity "${capability.parity?.[layer] ?? "missing"}"`);
    }
    const operationCoverage = requireArray(errors, capability.operation_coverage, `${label}.operation_coverage`);
    const coverageById = new Map(operationCoverage.map((coverage) => [coverage?.id, coverage]));
    for (const operation of operations) {
      const coverage = coverageById.get(operation);
      if (!coverage) {
        errors.push(`${label} operation ${operation} has no platform coverage decision`);
        continue;
      }
      for (const platform of ["desktop_web", "mobile_web", "ios", "android"]) {
        const status = coverage[platform];
        if (!operationStatuses.has(status)) errors.push(`${label} operation ${operation} has invalid ${platform} status "${status ?? "missing"}"`);
        if (status === "adapted" && !coverage.adaptation_ref) errors.push(`${label} operation ${operation} adapted on ${platform} requires adaptation_ref`);
        const platformRequired = capability.platforms?.[platform]?.required;
        if ((stage === "plan" || ledger.status === "approved") && platformRequired && status === "not_applicable") {
          errors.push(`${label} operation ${operation} cannot be not_applicable on required platform ${platform}`);
        }
        if ((stage === "plan" || ledger.status === "approved") && platformRequired && status === "missing") {
          const planned = (capability.task_ids ?? []).some((taskId) => {
            const task = taskById.get(taskId);
            return task?.operation_ids?.includes(operation) && task.platforms?.includes(platform);
          });
          if (!planned) errors.push(`${label} operation ${operation} is missing on required platform ${platform} without an operation-level task`);
        }
        if (["implementation", "verification", "release"].includes(stage) && platformRequired && !["implemented", "adapted"].includes(status)) {
          errors.push(`${label} operation ${operation} is ${status} on required platform ${platform}`);
        }
      }
    }
    for (const coverage of operationCoverage) if (!operations.includes(coverage?.id)) errors.push(`${label} coverage references unknown operation ${coverage?.id ?? "missing"}`);
    const taskIds = requireArray(errors, capability.task_ids, `${label}.task_ids`, { nonEmpty: requiresPlan });
    for (const taskId of taskIds) {
      const task = taskById.get(taskId);
      if (!task) errors.push(`${label} references unknown task ${taskId}`);
      else if (!task.capability_ids?.includes(capability.id)) errors.push(`${label} -> ${taskId} is not reciprocal`);
    }
    if (requiresPlan) for (const platform of ["desktop_web", "mobile_web", "ios", "android"].filter((value) => capability.platforms?.[value]?.required)) {
      if (!taskIds.some((taskId) => taskById.get(taskId)?.platforms?.includes(platform))) errors.push(`${label} has no task for required platform ${platform}`);
    }
  }

  for (const task of tasks) {
    const label = `task ${task.id ?? "<missing>"}`;
    if (!idPattern.test(task.id ?? "")) errors.push(`${label} has an invalid stable id`);
    if (task.phase !== "07-build") errors.push(`${label} must belong to phase 07-build`);
    if (!task.title || !task.owner) errors.push(`${label} requires title and owner`);
    if (!taskStatuses.has(task.status)) errors.push(`${label} has invalid status "${task.status ?? "missing"}"`);
    if (!evidenceLevels.has(task.evidence_level)) errors.push(`${label} has invalid evidence_level "${task.evidence_level ?? "missing"}"`);
    if (!["low", "medium", "high", "critical"].includes(task.risk)) errors.push(`${label} has invalid risk "${task.risk ?? "missing"}"`);
    requireArray(errors, task.acceptance_criteria, `${label}.acceptance_criteria`);
    requireArray(errors, task.files, `${label}.files`);
    const validations = requireArray(errors, task.validation, `${label}.validation`);
    if (validations.some((validation) => !validation?.command || validation.required !== true)) errors.push(`${label} validations require command and required=true`);
    const taskPlatforms = requireArray(errors, task.platforms, `${label}.platforms`);
    for (const platform of taskPlatforms) if (!platforms.has(platform)) errors.push(`${label} has invalid platform "${platform}"`);
    const operationIds = requireArray(errors, task.operation_ids ?? [], `${label}.operation_ids`, { nonEmpty: false });
    for (const operationId of operationIds) {
      const linked = (task.capability_ids ?? []).some((capabilityId) => capabilityById.get(capabilityId)?.semantics?.operations?.includes(operationId));
      if (!linked) errors.push(`${label} operation ${operationId} is not declared by a linked capability`);
    }
    for (const requirementId of requireArray(errors, task.requirement_ids, `${label}.requirement_ids`)) {
      if (!requirementById.has(requirementId)) errors.push(`${label} references unknown requirement ${requirementId}`);
    }
    for (const capabilityId of requireArray(errors, task.capability_ids, `${label}.capability_ids`)) {
      const capability = capabilityById.get(capabilityId);
      if (!capability) errors.push(`${label} references unknown capability ${capabilityId}`);
      else {
        if (!capability.task_ids?.includes(task.id)) errors.push(`${label} -> ${capabilityId} is not reciprocal`);
        for (const requirementId of task.requirement_ids ?? []) if (!capability.requirement_ids?.includes(requirementId)) errors.push(`${label} requirement ${requirementId} is not linked to capability ${capabilityId}`);
      }
    }
    for (const dependency of requireArray(errors, task.dependencies, `${label}.dependencies`, { nonEmpty: false })) {
      if (!taskById.has(dependency)) errors.push(`${label} references unknown dependency ${dependency}`);
      if (dependency === task.id) errors.push(`${label} cannot depend on itself`);
    }
    const taskBlockers = requireArray(errors, task.blocked_by, `${label}.blocked_by`, { nonEmpty: false });
    const evidenceRefs = requireArray(errors, task.evidence_refs, `${label}.evidence_refs`, { nonEmpty: false });
    if (task.status === "blocked" && taskBlockers.length === 0) errors.push(`${label} is blocked without blocked_by`);
    if (task.status === "done" && evidenceRefs.length === 0) errors.push(`${label} is done without evidence_refs`);
  }
  detectTaskCycles(tasks, errors);

  if (ledger.status === "blocked" && blockers.length === 0) errors.push("blocked ledger requires blockers");
  if ((requirements.length === 0) !== (capabilities.length === 0)) errors.push("requirements and capabilities must be populated together");
  if (ledger.status === "approved") {
    if (!ledger.approved_by || !ledger.approved_at || !ledger.approval_source) errors.push("approved ledger requires approved_by, approved_at and approval_source");
    if (blockers.length) errors.push("approved ledger cannot contain blockers");
    for (const task of tasks) if (!["ready", "in_progress", "done", "blocked"].includes(task.status)) errors.push(`approved ledger task ${task.id} must be ready, in_progress, done or explicitly blocked`);
  }

  if (ledger.previous_ledger) {
    const previousFile = resolve(dirname(ledgerFile), ledger.previous_ledger);
    if (!existsSync(previousFile)) errors.push(`previous_ledger does not exist: ${ledger.previous_ledger}`);
    else {
      const previous = JSON.parse(readFileSync(previousFile, "utf8"));
      for (const requirement of previous.requirements ?? []) if (!requirementById.has(requirement.id) && !approvedRemoval(changeRequests, "requirement", requirement.id)) errors.push(`scope drop requires approved change request for requirement ${requirement.id}`);
      for (const capability of previous.capabilities ?? []) if (!capabilityById.has(capability.id) && !approvedRemoval(changeRequests, "capability", capability.id)) errors.push(`scope drop requires approved change request for capability ${capability.id}`);
    }
  }

  return errors.map((error) => `${relative(root, ledgerFile)}: ${error}`);
}

export function validateLedgerFile(root, ledgerFile, options = {}) {
  if (!existsSync(ledgerFile)) return [`${relative(root, ledgerFile)}: delivery ledger is missing`];
  try {
    return validateLedger(root, JSON.parse(readFileSync(ledgerFile, "utf8")), ledgerFile, options);
  } catch (error) {
    return [`${relative(root, ledgerFile)}: invalid JSON (${error.message})`];
  }
}