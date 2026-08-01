import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Loader2, Brain, Database, Link2, ChevronDown, ChevronRight,
  Users, AlertTriangle, Check, X, Sparkles, Megaphone, Radio, Rocket, Tent,
} from 'lucide-react';

/**
 * M9.6 — the Phase 9 UI.
 *
 * Until this existed, five committed backend milestones were unreachable from the
 * product: the frontend made zero calls to /api/chat, /api/triage or /api/memory.
 *
 * Three things this deliberately shows rather than hides, because they are the
 * product rather than debug output:
 *
 *   1. RECALL. Every answer carries what it was built from — remembered notes and
 *      sourced facts with their URLs. An answer you cannot audit is a claim.
 *   2. DISAGREEMENT. /triage surfaces tensions between the two agents in their own
 *      block rather than averaging them away. Two specialists pulling against each
 *      other is information the CMO needs.
 *   3. ISOLATION. The memory inspector flips between agent:branding, agent:pr and
 *      triage:branding+pr, so "neither private memory was touched" is something you
 *      can look at instead of something the README asserts.
 */

const AGENTS = [
  { id: 'branding',          label: 'Branding',          Icon: Sparkles,  active: true  },
  { id: 'pr',                label: 'PR',                Icon: Megaphone, active: true  },
  { id: 'social',            label: 'Social',            Icon: Radio,     active: false },
  { id: 'product_marketing', label: 'Product Marketing', Icon: Rocket,    active: false },
  { id: 'events',            label: 'Field Events',      Icon: Tent,      active: false },
];

const label = (id) => AGENTS.find((a) => a.id === id)?.label ?? id;

/** `/triage branding pr How do we answer X` -> { agents, message }. Null if not a bridge. */
export function parseTriage(raw) {
  const text = (raw || '').trim();
  if (!text.toLowerCase().startsWith('/triage')) return null;
  const rest = text.slice('/triage'.length).trim();
  const parts = rest.split(/\s+/);
  const ids = new Set(AGENTS.map((a) => a.id));
  const agents = [];
  let i = 0;
  while (i < parts.length && agents.length < 2 && ids.has(parts[i])) {
    agents.push(parts[i]);
    i += 1;
  }
  const message = parts.slice(i).join(' ');
  return { agents, message };
}

const Pill = ({ tone = 'slate', children }) => {
  const tones = {
    slate: 'bg-[#F2EEE7] text-[#44403C]',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    accent: 'bg-[#D97757]/10 text-[#D97757]',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
};

/** What an answer was built from. Collapsed by default — available, not shouted. */
function RecallDisclosure({ recall, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!recall) return null;
  const memories = recall.memories || [];
  const facts = recall.facts || [];
  const graph = recall.graph || [];

  return (
    <div className="mt-2 border-t border-[#E7E2DA] pt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] text-[#78716C] hover:text-[#1C1917] transition-colors"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        built from {memories.length} note{memories.length === 1 ? '' : 's'} · {facts.length} sourced fact{facts.length === 1 ? '' : 's'}
        {graph.length > 0 && ` · ${graph.length} via graph`}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {memories.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#78716C] uppercase tracking-wide mb-1">
                <Brain className="w-3 h-3" /> Remembered
              </div>
              {memories.map((m) => (
                <div key={m.id} className="text-[11px] text-[#44403C] bg-[#FAF9F7] rounded-lg px-2 py-1.5 mb-1">
                  <Pill tone="accent">{m.namespace}</Pill>{' '}
                  <Pill>{m.tier}</Pill>
                  <div className="mt-1">{m.content}</div>
                </div>
              ))}
            </div>
          )}

          {facts.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#78716C] uppercase tracking-wide mb-1">
                <Database className="w-3 h-3" /> Grounded facts
              </div>
              {facts.map((f, i) => (
                <div key={i} className="text-[11px] text-[#44403C] bg-[#FAF9F7] rounded-lg px-2 py-1.5 mb-1">
                  <Pill>{f.organization}</Pill>
                  <div className="mt-1">{f.content}</div>
                  {f.source_url && (
                    <a
                      href={f.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 mt-1 text-[10px] text-[#D97757] hover:underline break-all"
                    >
                      <Link2 className="w-2.5 h-2.5 shrink-0" />
                      {f.source_url}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {graph.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-[#78716C] uppercase tracking-wide mb-1">
                Graph paths
              </div>
              {graph.map((p, i) => (
                <div key={i} className="text-[11px] font-mono text-[#44403C] bg-[#FAF9F7] rounded-lg px-2 py-1 mb-1 break-all">
                  {Array.isArray(p.path) ? p.path.join(' → ') : JSON.stringify(p)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Whether the turn became memory, and why. Shown rather than done silently. */
function MemoryVerdict({ verdict }) {
  if (!verdict || typeof verdict.admitted === 'undefined') return null;
  return verdict.admitted ? (
    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700">
      <Check className="w-3 h-3 shrink-0" />
      remembered as <Pill tone="green">{verdict.category}</Pill>
      <Pill tone="green">{verdict.tier}</Pill>
    </div>
  ) : (
    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#78716C]">
      <X className="w-3 h-3 shrink-0" />
      not remembered — {verdict.reason}
    </div>
  );
}

/** The bridge result: two views kept apart, then merged, with tensions kept visible. */
function TriageResult({ data }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] text-[#78716C]">
        <Users className="w-3.5 h-3.5" />
        <span>bridged in</span>
        <Pill tone="accent">{data.namespace}</Pill>
      </div>

      {/* Each agent reasoned alone. Shown side by side, with its OWN recall, so the
          two are visibly briefed differently rather than sharing one context. */}
      <div className="grid md:grid-cols-2 gap-3">
        {(data.views || []).map((v) => (
          <div key={v.agent} className="border border-[#E7E2DA] rounded-xl p-3 bg-white">
            <div className="text-[11px] font-semibold text-[#1C1917] mb-1.5">{label(v.agent)}</div>
            <div className="text-[13px] text-[#44403C] leading-relaxed whitespace-pre-wrap">{v.view}</div>
            <RecallDisclosure recall={v.recall} />
          </div>
        ))}
      </div>

      <div className="border border-[#D97757]/30 bg-[#D97757]/5 rounded-xl p-3">
        <div className="text-[11px] font-semibold text-[#D97757] uppercase tracking-wide mb-1.5">Merged</div>
        <div className="text-[14px] text-[#1C1917] leading-relaxed whitespace-pre-wrap">{data.answer}</div>
      </div>

      {(data.tensions || []).length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Where they disagree
          </div>
          <ul className="space-y-1">
            {data.tensions.map((t, i) => (
              <li key={i} className="text-[13px] text-amber-900 leading-relaxed">• {t}</li>
            ))}
          </ul>
        </div>
      )}

      {(data.agreements || []).length > 0 && (
        <div className="border border-[#E7E2DA] rounded-xl p-3 bg-white">
          <div className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wide mb-1.5">Both agree</div>
          <ul className="space-y-1">
            {data.agreements.map((a, i) => (
              <li key={i} className="text-[13px] text-[#44403C] leading-relaxed">• {a}</li>
            ))}
          </ul>
        </div>
      )}

      {data.recommended_action && (
        <div className="text-[13px] text-[#1C1917]">
          <span className="font-semibold">Next step: </span>{data.recommended_action}
        </div>
      )}

      <MemoryVerdict verdict={data.memory} />
    </div>
  );
}

/** Namespace-scoped memory. The isolation boundary, made clickable. */
function MemoryInspector({ agent }) {
  const [scope, setScope] = useState('own');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const partner = agent === 'branding' ? 'pr' : 'branding';
  const query = scope === 'own' ? `agent=${agent}` : `agents=${agent},${partner}`;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/memory?${query}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ error: 'failed to load' }))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="border border-[#E7E2DA] rounded-xl bg-white p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1C1917] mb-2">
        <Brain className="w-3.5 h-3.5" /> Memory
      </div>

      <div className="flex gap-1 mb-2">
        {[
          { id: 'own', text: `agent:${agent}` },
          { id: 'joint', text: `triage:${[agent, partner].sort().join('+')}` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setScope(t.id)}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all ${
              scope === t.id ? 'bg-[#D97757] text-white' : 'bg-[#F2EEE7] text-[#44403C] hover:bg-[#E7E2DA]'
            }`}
          >
            {t.text}
          </button>
        ))}
      </div>

      {loading && <div className="text-[11px] text-[#78716C]">loading…</div>}

      {!loading && data && (
        <>
          <div className="text-[10px] text-[#78716C] mb-1.5">
            {(data.memories || []).length} memor{(data.memories || []).length === 1 ? 'y' : 'ies'} in this namespace
          </div>
          {(data.memories || []).length === 0 ? (
            <div className="text-[11px] text-[#78716C] italic">
              empty — nothing has been promoted here
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {data.memories.map((m) => (
                <div key={m.id} className="text-[11px] text-[#44403C] bg-[#FAF9F7] rounded-lg px-2 py-1.5">
                  <Pill>{m.tier}</Pill>{' '}
                  {m.provenance && <Pill tone="accent">{m.provenance}</Pill>}
                  <div className="mt-1">{m.content}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ChatPanel({ provider }) {
  const [agent, setAgent] = useState('branding');
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [memoryKey, setMemoryKey] = useState(0);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns, busy]);

  // Switching agent starts a new conversation: a thread is pinned to one namespace,
  // so carrying thread_id across would file one agent's history under another's.
  const switchAgent = (id) => {
    setAgent(id);
    setTurns([]);
    setThreadId(null);
    setError(null);
  };

  const send = async () => {
    const raw = input.trim();
    if (!raw || busy) return;

    const bridge = parseTriage(raw);
    if (bridge && (bridge.agents.length !== 2 || !bridge.message)) {
      setError('usage: /triage <agent> <agent> <question> — two different agents, then the question');
      return;
    }

    setError(null);
    setBusy(true);
    setInput('');
    setTurns((t) => [...t, { role: 'user', text: bridge ? bridge.message : raw, bridge: bridge?.agents }]);

    try {
      const res = await fetch(bridge ? '/api/triage' : '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          bridge
            ? { agents: bridge.agents, message: bridge.message, thread_id: null, provider }
            : { agent, message: raw, thread_id: threadId, provider },
        ),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

      if (bridge) {
        setTurns((t) => [...t, { role: 'triage', data }]);
      } else {
        setThreadId(data.thread_id);
        setTurns((t) => [...t, { role: 'agent', agent: data.agent, data }]);
      }
      setMemoryKey((k) => k + 1);   // memory may have changed; re-read it
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const draft = parseTriage(input);

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
      <div className="flex flex-col min-h-0">
        {/* Agent rail */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {AGENTS.map(({ id, label: text, Icon, active }) => (
            <button
              key={id}
              onClick={() => switchAgent(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                agent === id
                  ? 'bg-[#D97757] text-white shadow-xs'
                  : 'text-[#44403C] hover:bg-[#F2EEE7] hover:text-[#1C1917]'
              }`}
              title={active ? undefined : 'Registered, but parked pending a scope decision (Phase 8)'}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {text}
              {!active && <span className="text-[9px] opacity-60">parked</span>}
            </button>
          ))}
        </div>

        {/* Transcript */}
        <div className="flex-1 min-h-[320px] max-h-[60vh] overflow-y-auto space-y-3 pr-1">
          {turns.length === 0 && (
            <div className="text-[13px] text-[#78716C] border border-dashed border-[#E7E2DA] rounded-xl p-4">
              Talking to <span className="font-medium text-[#1C1917]">{label(agent)}</span>. It reads the shared
              corpus, its own memory, and any joint memory it belongs to — nothing else.
              <div className="mt-2 font-mono text-[11px] text-[#D97757]">
                /triage branding pr How do we answer the Nebius price cut?
              </div>
              <div className="mt-1">bridges two agents onto one question without their memories mixing.</div>
            </div>
          )}

          {turns.map((t, i) => {
            if (t.role === 'user') {
              return (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] bg-[#F2EEE7] rounded-xl px-3 py-2">
                    {t.bridge && (
                      <div className="text-[10px] text-[#D97757] font-medium mb-0.5">
                        /triage {t.bridge.join(' ')}
                      </div>
                    )}
                    <div className="text-[13px] text-[#1C1917]">{t.text}</div>
                  </div>
                </div>
              );
            }
            if (t.role === 'triage') return <TriageResult key={i} data={t.data} />;
            return (
              <div key={i} className="border border-[#E7E2DA] rounded-xl p-3 bg-white">
                <div className="text-[11px] font-semibold text-[#1C1917] mb-1.5">{label(t.agent)}</div>
                <div className="text-[14px] text-[#1C1917] leading-relaxed whitespace-pre-wrap">{t.data.reply}</div>
                <RecallDisclosure recall={t.data.recall} />
                <MemoryVerdict verdict={t.data.memory} />
              </div>
            );
          })}

          {busy && (
            <div className="flex items-center gap-2 text-[12px] text-[#78716C]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {draft ? 'both agents reasoning separately…' : `${label(agent)} is thinking…`}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {error && (
          <div className="mt-2 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Composer */}
        <div className="mt-3">
          {draft && draft.agents.length === 2 && (
            <div className="mb-1.5 text-[11px] text-[#D97757]">
              bridging <span className="font-medium">{draft.agents.map(label).join(' + ')}</span> — they answer
              separately, then merge
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              rows={2}
              placeholder={`Ask ${label(agent)}, or type /triage to bridge two agents…`}
              className="flex-1 resize-none border border-[#E7E2DA] rounded-xl px-3 py-2 text-[13px] text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97757]/30"
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="px-4 rounded-xl bg-[#D97757] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <MemoryInspector key={`${agent}-${memoryKey}`} agent={agent} />
        <div className="text-[11px] text-[#78716C] leading-relaxed">
          A joint namespace is readable by its two members and nobody else. A `/triage` turn is
          written there and to neither private side — switch the tabs above after bridging to see
          that the private namespaces stayed empty.
        </div>
      </div>
    </div>
  );
}
