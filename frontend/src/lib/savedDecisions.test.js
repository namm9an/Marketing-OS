import { describe, expect, it } from 'vitest';
import { restoreSavedDecision } from './savedDecisions';

describe('saved workflow contracts', () => {
  it('preserves snapshot contents and reads review state from the current record', () => {
    const result = { positioning: { statement: 'Actual response', state: 'ACTIVE' },
      decision: { selected_option: 'Title', review_status: 'unreviewed' }, metrics: { total_tokens: null } };
    const row = { id: 'one', workflow_type: 'run', result_available: true, result,
      review_status: 'approved', reviewed_by: 'operator', reviewed_at: '2026-11-15T10:00:00Z' };
    const restored = restoreSavedDecision(row);
    expect(restored.positioning).toEqual(result.positioning);
    expect(restored.metrics.total_tokens).toBeNull();
    expect(restored.decision.review_status).toBe('approved');
    expect(result.decision.review_status).toBe('unreviewed');
    expect(restored.knowledge_units).toEqual([]);
  });

  it('never substitutes the old title for missing output', () => {
    const restored = restoreSavedDecision({ id: 'legacy', selected_option: 'Old title', result_available: false });
    expect(restored.positioning).toBeNull();
    expect(restored.result_available).toBe(false);
    expect(restored.decision.selected_option).toBe('Old title');
  });
});
