/** Preserve saved workflow payloads while overlaying the current audit metadata. */
export function restoreSavedDecision(row) {
  const snapshot = row.result_available && row.result && !Array.isArray(row.result)
    && typeof row.result === 'object' ? row.result : null;
  const decision = snapshot?.decision || {};
  return {
    ...snapshot,
    workflow_type: row.workflow_type || 'legacy',
    result_available: Boolean(snapshot),
    goalStatement: snapshot?.goalStatement ?? row.goal_statement ?? '',
    timestamp: row.created_at || null,
    positioning: row.workflow_type === 'run' ? snapshot?.positioning ?? null : null,
    knowledge_units: Array.isArray(snapshot?.knowledge_units) ? snapshot.knowledge_units : [],
    decision: {
      ...decision,
      id: row.id,
      selected_option: decision.selected_option ?? row.selected_option ?? 'Saved decision',
      confidence: decision.confidence ?? row.confidence ?? 'Unavailable',
      rationale: decision.rationale ?? row.rationale ?? '',
      risks: decision.risks ?? row.risks ?? '',
      reasoning_source: decision.reasoning_source ?? row.reasoning_source ?? 'Unavailable',
      escalated: Boolean(row.escalated ?? decision.escalated),
      review_status: row.review_status || 'unreviewed',
      reviewed_by: row.reviewed_by || null,
      reviewed_at: row.reviewed_at || null,
    },
  };
}

export function newRunRecord(result, goal) {
  return restoreSavedDecision({
    ...result.decision,
    goal_statement: goal,
    workflow_type: 'run', result_available: true, result,
    created_at: new Date().toISOString(),
    review_status: result.decision.escalated ? 'pending' : 'unreviewed',
  });
}
