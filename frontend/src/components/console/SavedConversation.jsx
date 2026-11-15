import React from 'react';

export default function SavedConversation({ data }) {
  return (
    <section aria-label="Saved result" className="bg-white border border-[#E7E2D8] rounded-xl p-5 space-y-3">
      <h3 className="font-semibold text-[#1C1917]">{data.decision.selected_option}</h3>
      <p className="text-xs text-[#78716C]">Saved {data.workflow_type} · {data.goalStatement}</p>
      {!data.result_available ? (
        <p role="status">Original result unavailable. This older record only contains decision metadata.</p>
      ) : (
        <>
          <p className="whitespace-pre-wrap text-sm">{data.reply || data.answer || 'The saved response is available in the details below.'}</p>
          {data.recommended_action && <p className="text-sm">Recommended action: {data.recommended_action}</p>}
          <details className="text-xs">
            <summary className="cursor-pointer">Stored response details</summary>
            <pre className="whitespace-pre-wrap break-words mt-2">{JSON.stringify(data, null, 2)}</pre>
          </details>
        </>
      )}
    </section>
  );
}
