import React from 'react';
import { adaptWorkflow } from '../../lib/presentation';

export default function SavedConversation({ data }) {
  const view = adaptWorkflow(data.workflow_type, data, { request: { goal: data.goalStatement }, reviewRow: data.decision });
  return (
    <section aria-label="Saved result" className="bg-white border border-[#E7E2D8] rounded-xl p-5 space-y-3">
      <h3 className="font-semibold text-[#1C1917]">{data.decision.selected_option}</h3>
      <p className="text-xs text-[#44403C]">Saved {view.workflow} · {view.input.text}</p>
      {!data.result_available ? (
        <p role="status">Original result unavailable. This older record only contains decision metadata.</p>
      ) : (
        <>
          <p className="whitespace-pre-wrap text-sm">{view.output.text || 'The saved response is available in the details below.'}</p>
          {view.output.recommendedAction && <p className="text-sm">Recommended action: {view.output.recommendedAction}</p>}
          <p className="text-xs text-[#44403C]">{view.evidence.note}</p>
          <details className="text-xs">
            <summary className="cursor-pointer">Stored response details</summary>
            <pre className="whitespace-pre-wrap break-words mt-2">{JSON.stringify(data, null, 2)}</pre>
          </details>
        </>
      )}
    </section>
  );
}
