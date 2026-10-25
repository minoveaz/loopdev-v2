export function validateCurrentPhaseDependencies(manifest, checkpoints, phaseById) {
  const errors = [];
  const invalidatedPhases = new Set(manifest.invalidated_phases ?? []);

  for (const [phaseId, checkpoint] of checkpoints) {
    const phase = phaseById.get(phaseId);
    if (
      !phase
      || checkpoint.status !== "completed"
      || checkpoint.invalidated === true
      || invalidatedPhases.has(phaseId)
    ) {
      continue;
    }

    for (const predecessor of phase.predecessors) {
      const predecessorCheckpoint = checkpoints.get(predecessor);
      if (
        predecessorCheckpoint?.status !== "completed"
        || predecessorCheckpoint.invalidated === true
        || invalidatedPhases.has(predecessor)
      ) {
        errors.push(`completed phase "${phaseId}" requires completed predecessor "${predecessor}"`);
      }
    }

    if (phase.required_gate) {
      const approval = manifest.approvals?.[phase.required_gate];
      const approvalStatus = typeof approval === "string" ? approval : approval?.status;
      if (approvalStatus !== "approved") {
        errors.push(`completed phase "${phaseId}" requires approved gate "${phase.required_gate}"`);
      }
    }
  }

  return errors;
}
