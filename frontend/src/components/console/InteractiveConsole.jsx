import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles, Copy, Check, FileText, AlertCircle, LogOut,
  History, Database, User, Lock, ArrowRight,
  Eye, EyeOff, Menu, X, ShieldCheck, Network, Printer, RefreshCw, MessageSquare
} from 'lucide-react';
import CompetitorNetwork from '../CompetitorNetwork';
import ChatPanel from '../ChatPanel';
import SavedConversation from './SavedConversation';
import DecisionReview from './DecisionReview';
import { restoreSavedDecision, newRunRecord } from '../../lib/savedDecisions';
import { apiJson } from '../../lib/api';
import { AGENTS } from '../../lib/agents';
import ExecutionDetails from '../ExecutionDetails';
import { useRequestScope } from '../../lib/useRequestScope';
import { useMediaQuery } from '../../lib/useMediaQuery';

// The gradient background pulls in three + @react-three/fiber (~150kB gzipped) for
// something purely decorative. Lazy so it never sits on the critical path — the app is
// fully usable the moment it renders, and the background fades in behind it.
const ShaderCanvas = React.lazy(() => import('../ShaderCanvas'));
const Backdrop = React.memo((props) => (
  <React.Suspense fallback={null}><ShaderCanvas {...props} /></React.Suspense>
));

export default function InteractiveConsole({ onBackToCaseStudy }) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const narrowViewport = useMediaQuery('(max-width: 767px)');
  const navToggle = useRef(null);
  const navigation = useRef(null);
  const restoreNavFocus = useRef(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [username, setUsername] = useState('');
  const [loginUser, setLoginUser] = useState('');
  const [loginPwd, setLoginPwd] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('workbench');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [goal, setGoal] = useState('Position B200 against Nebius using available reliability evidence');
  const [selectedAgent, setSelectedAgent] = useState('branding');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [copied, setCopied] = useState(false);
  const [network, setNetwork] = useState(null);
  const [networkVersion, setNetworkVersion] = useState(0);
  const [networkError, setNetworkError] = useState(null);
  const [digest, setDigest] = useState(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState(null);
  const authRequest = useRequestScope();
  const runRequest = useRequestScope();
  const digestRequest = useRequestScope();
  const historyRequest = useRequestScope();
  const networkRequest = useRequestScope();
  const backdropAgents = useMemo(() => activeTab === 'workbench' ? [selectedAgent] : [], [activeTab, selectedAgent]);

  useEffect(() => {
    if (narrowViewport && sidebarOpen) navigation.current?.querySelector('button')?.focus();
    if (!sidebarOpen && restoreNavFocus.current) {
      navToggle.current?.focus();
      restoreNavFocus.current = false;
    }
  }, [narrowViewport, sidebarOpen]);
  const closeNavigation = () => {
    restoreNavFocus.current = true;
    setSidebarOpen(false);
  };
  const selectTab = (tab) => {
    setActiveTab(tab);
    if (narrowViewport) closeNavigation();
  };
  const navigationKeyDown = (event) => {
    if (!narrowViewport || !sidebarOpen) return;
    if (event.key === 'Escape') { closeNavigation(); return; }
    if (event.key !== 'Tab') return;
    const buttons = [...navigation.current.querySelectorAll('button:not(:disabled)')];
    const first = buttons[0];
    const last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  useEffect(() => {
    const pending = authRequest.begin();
    apiJson('/api/me', { signal: pending.signal })
      .then((data) => {
        if (!pending.isCurrent()) return;
        setAuthenticated(Boolean(data.authenticated));
        setUsername(data.username || '');
      })
      .catch((err) => { if (pending.isCurrent() && err.name !== 'AbortError') setLoginError(err.message); })
      .finally(() => { if (pending.isCurrent()) setAuthChecking(false); });
    return authRequest.cancel;
  }, [authRequest]);

  useEffect(() => {
    if (!authenticated) return;
    const pending = historyRequest.begin();
    setHistoryLoading(true);
    setHistoryError(null);
    apiJson('/api/history', { signal: pending.signal })
      .then((data) => {
        if (pending.isCurrent()) setHistory(data.history.map(restoreSavedDecision));
      })
      .catch((err) => { if (pending.isCurrent() && err.name !== 'AbortError') setHistoryError(err.message); })
      .finally(() => { if (pending.isCurrent()) setHistoryLoading(false); });
    return historyRequest.cancel;
  }, [authenticated, historyVersion, historyRequest]);

  useEffect(() => {
    if (!authenticated || activeTab !== 'digest' || network) return;
    const pending = networkRequest.begin();
    setNetworkError(null);
    apiJson('/api/digest/network', { signal: pending.signal })
      .then((data) => { if (pending.isCurrent()) setNetwork(data); })
      .catch((err) => { if (pending.isCurrent() && err.name !== 'AbortError') setNetworkError(err.message); });
    return networkRequest.cancel;
  }, [authenticated, activeTab, network, networkVersion, networkRequest]);

  const refreshHistory = () => setHistoryVersion((version) => version + 1);
  const updateReview = (row) => {
    const restored = restoreSavedDecision(row);
    setCurrentData((previous) => previous?.decision.id === row.id ? restored : previous);
    setHistory((previous) => previous.map((item) => item.decision.id === row.id ? restored : item));
  };
  const selectAgent = (id) => {
    runRequest.cancel();
    setSelectedAgent(id);
    setLoading(false);
    setCurrentData(null);
    setError(null);
    setCopied(false);
  };
  const openSaved = (run) => {
    runRequest.cancel();
    setLoading(false);
    setError(null);
    setCopied(false);
    setCurrentData(run);
    const recordedAgent = AGENTS.find(({ id }) => run.decision.reasoning_source?.startsWith(`langgraph:${id}:`));
    if (run.workflow_type === 'run' && recordedAgent) setSelectedAgent(recordedAgent.id);
    setGoal(run.goalStatement);
    setActiveTab('workbench');
    if (narrowViewport) closeNavigation();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (authBusy) return;
    const pending = authRequest.begin();
    setLoginError(null);
    setAuthBusy(true);
    try {
      const data = await apiJson('/api/login', { method: 'POST', signal: pending.signal,
        body: JSON.stringify({ username: loginUser, password: loginPwd }) });
      if (!pending.isCurrent()) return;
      setAuthenticated(true);
      setUsername(data.username || loginUser);
      setLoginPwd('');
    } catch (err) {
      if (pending.isCurrent() && err.name !== 'AbortError') setLoginError(err.message);
    } finally {
      if (pending.isCurrent()) setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    if (authBusy) return;
    runRequest.cancel();
    digestRequest.cancel();
    historyRequest.cancel();
    networkRequest.cancel();
    setLoading(false);
    setDigestLoading(false);
    setAuthBusy(true);
    setError(null);
    const pending = authRequest.begin();
    try {
      await apiJson('/api/logout', { method: 'POST', signal: pending.signal });
      if (!pending.isCurrent()) return;
      setAuthenticated(false);
      setCurrentData(null);
      setHistory([]);
      setHistoryError(null);
      setNetwork(null);
      setNetworkError(null);
      setDigest(null);
      setDigestError(null);
      setSelectedAgent('branding');
      setActiveTab('workbench');
      setGoal('');
      setLoginPwd('');
      setLoginUser('');
      setUsername('');
      setShowPassword(false);
      setCopied(false);
    } catch (err) {
      if (pending.isCurrent() && err.name !== 'AbortError') setError(`Sign out failed: ${err.message}`);
    } finally {
      if (pending.isCurrent()) setAuthBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return;
    if (!goal.trim()) { setError('Enter a business goal.'); return; }
    const submittedGoal = goal.trim();
    const pending = runRequest.begin();
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const json = await apiJson('/api/run', { method: 'POST', signal: pending.signal,
        body: JSON.stringify({ goal: submittedGoal, agent_type: selectedAgent }) });
      if (!pending.isCurrent()) return;
      const runRecord = newRunRecord(json, submittedGoal);
      setCurrentData(runRecord);
      setHistory((previous) => [runRecord, ...previous]);
      refreshHistory();
    } catch (err) {
      if (pending.isCurrent() && err.name !== 'AbortError') setError(err.message);
    } finally {
      if (pending.isCurrent()) setLoading(false);
    }
  };

  const runDigest = async () => {
    if (digestLoading) return;
    const pending = digestRequest.begin();
    setDigestLoading(true);
    setDigestError(null);
    try {
      const data = await apiJson('/api/digest', { method: 'POST', signal: pending.signal, body: '{}' });
      if (!pending.isCurrent()) return;
      setDigest(data);
      if (data.network) setNetwork(data.network);
    } catch (err) {
      if (pending.isCurrent() && err.name !== 'AbortError') setDigestError(err.message);
    } finally {
      if (pending.isCurrent()) setDigestLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit(e);
  };
  const handleCopy = async () => {
    if (!currentData?.positioning) return;
    const md = `# Positioning Strategy Brief\n\n**Strategy:** ${currentData.decision.selected_option}\n**State:** ${currentData.positioning.state || 'Unavailable'}\n**Confidence:** ${currentData.decision.confidence}\n\n## Business Goal\n${currentData.goalStatement}\n\n## Positioning Statement\n${currentData.positioning.statement}\n\n## Strategic Rationale\n${currentData.decision.rationale}\n\n## Identified Risks\n${currentData.decision.risks}\n`;
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
    } catch { setError('Could not copy the report. Use the Markdown download instead.'); }
  };
  const handleExportMd = async () => {
    if (!currentData?.positioning) return;
    setError(null);
    try {
      const res = await fetch('/api/export/markdown', { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentData) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || `Export failed (${res.status})`);
      }
      const url = window.URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `positioning-brief-${currentData.decision.id}.md`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 0);
    } catch (err) { setError(err.message); }
  };

  if (authChecking) {
    return (
      <div className="bg-[#FBF9F5] min-h-screen flex items-center justify-center text-xs text-[#44403C]">
        Loading Marketing OS...
      </div>
    );
  }

  // Render Login Modal if unauthenticated (Clean Swiss Intelligence Terminal)
  if (!authenticated) {
    return (
      <div className="bg-[#F6F5F1] text-[#111315] font-sans antialiased min-h-screen flex items-center justify-center p-4 relative select-none">
        <div className="w-full max-w-[400px] space-y-4 relative z-10">

          <div className="flex items-center justify-between border-b border-[#D4D1C7] pb-3">
            <div className="space-y-0.5 text-left">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#4A505C]">
                Governed Intelligence Workbench
              </span>
              <h1 className="text-xl font-display font-bold tracking-tight text-[#111315]">
                Marketing OS
              </h1>
            </div>
            {onBackToCaseStudy && (
              <button
                onClick={onBackToCaseStudy}
                className="text-xs text-[#2563EB] hover:text-[#111315] font-mono transition-colors cursor-pointer"
              >
                ← Showcase
              </button>
            )}
          </div>

          <div className="bg-[#FFFFFF] border border-[#111315] shadow-sm">
            {/* Terminal Header Strip */}
            <div className="flex items-center justify-between border-b border-[#111315] bg-[#ECEAE3]/70 px-4 py-2 text-xs font-mono">
              <span className="font-semibold text-[#111315]">AUTH GATEWAY</span>
              <span className="text-[10.5px] text-[#4A505C]">OPERATIONAL CONSOLE</span>
            </div>

            <div className="p-6 space-y-5">
              {loginError && (
                <div role="alert" className="p-3 bg-[#FEF2F2] border border-[#B91C1C]/30 text-[#991B1B] text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="operator-username" className="block text-xs font-mono uppercase tracking-wider text-[#4A505C]">
                    Operator Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4A505C]" />
                    <input
                      id="operator-username" autoComplete="username"
                      type="text"
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      required
                      autoFocus
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#FFFFFF] border border-[#D4D1C7] text-xs text-[#111315] font-mono placeholder-[#A0A6B2] focus:outline-none focus:border-[#111315] transition-colors"
                      placeholder="admin"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="operator-password" className="block text-xs font-mono uppercase tracking-wider text-[#4A505C]">
                    Access Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4A505C]" />
                    <input
                      id="operator-password" autoComplete="current-password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginPwd}
                      onChange={(e) => setLoginPwd(e.target.value)}
                      required
                      className="w-full pl-9 pr-10 py-2.5 bg-[#FFFFFF] border border-[#D4D1C7] text-xs text-[#111315] font-mono placeholder-[#A0A6B2] focus:outline-none focus:border-[#111315] transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A505C] hover:text-[#111315] transition-colors p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={authBusy}
                  className="w-full mt-2 py-2.5 px-4 bg-[#111315] hover:bg-[#2563EB] text-[#FFFFFF] font-mono font-medium text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Lock size={12} strokeWidth={2} />
                  <span>{authBusy ? "Authenticating…" : "Authenticate Operator"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <p className="text-xs text-[#4A505C]">Use the operator credentials configured for this server.</p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Render Full Workspace Application with Left Sidebar
  return (
    <div className="bg-[#FBF9F5] text-[#1C1917] font-sans antialiased min-h-screen flex selection:bg-[#1C1917]/20 selection:text-[#1C1917] relative overflow-hidden">

      {/* Ambient gradient background, tinted by whichever agent is in focus */}
      {!reducedMotion && <Backdrop agents={backdropAgents} />}

      {/* Left Navigation Sidebar */}
      {narrowViewport && sidebarOpen && <button aria-label="Close navigation overlay" onClick={closeNavigation}
        className="fixed inset-0 z-30 bg-black/30" />}
      <aside id="console-navigation" ref={navigation} onKeyDown={navigationKeyDown}
        role={narrowViewport && sidebarOpen ? 'dialog' : undefined}
        aria-modal={narrowViewport && sidebarOpen ? true : undefined}
        aria-label="Console navigation"
        className={`fixed inset-y-0 left-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-xl border-r border-[#E7E2D8] transition-all duration-300 flex flex-col justify-between ${
          sidebarOpen ? 'w-64' : 'w-16'
        } ${narrowViewport && !sidebarOpen ? 'hidden' : ''} overflow-y-auto`}
      >
        <div className="space-y-6 p-4">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-base tracking-tight text-[#1C1917]">Marketing OS</span>
                <span className="text-[10px] font-mono text-[#44403C] border border-[#E0DACE] px-1.5 py-0.5 rounded bg-[#F2EEE7]">v1.0</span>
              </div>
            ) : (
              <span className="font-bold text-lg text-[#44403C] mx-auto">M</span>
            )}
            <button
              aria-label={narrowViewport ? 'Close navigation' : 'Toggle sidebar'}
              onClick={() => narrowViewport ? closeNavigation() : setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-lg text-[#44403C] hover:text-[#1C1917] hover:bg-[#F2EEE7] transition-colors"
              title="Toggle Sidebar"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Menu Links */}
          <nav className="space-y-1">
            <button
              aria-label="Workbench" onClick={() => selectTab('workbench')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'workbench'
                  ? 'bg-[#1C1917] text-white shadow-xs'
                  : 'text-[#44403C] hover:bg-[#F2EEE7] hover:text-[#1C1917]'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Workbench</span>}
            </button>

            <button
              aria-label="Agent Chat" onClick={() => selectTab('chat')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-[#1C1917] text-white shadow-xs'
                  : 'text-[#44403C] hover:bg-[#F2EEE7] hover:text-[#1C1917]'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Agent Chat</span>}
            </button>

            <button
              aria-label="Decision History" onClick={() => selectTab('history')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-[#1C1917] text-white shadow-xs'
                  : 'text-[#44403C] hover:bg-[#F2EEE7] hover:text-[#1C1917]'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              {sidebarOpen && (
                <div className="flex items-center justify-between flex-1">
                  <span>Decision History</span>
                  {history.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20 text-current">{history.length}</span>
                  )}
                </div>
              )}
            </button>

            <button
              aria-label="On-demand Digest" onClick={() => selectTab('digest')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'digest'
                  ? 'bg-[#1C1917] text-white shadow-xs'
                  : 'text-[#44403C] hover:bg-[#F2EEE7] hover:text-[#1C1917]'
              }`}
            >
              <Network className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>On-demand Digest</span>}
            </button>

            <button
              aria-label="Knowledge Base" onClick={() => selectTab('knowledge')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'knowledge'
                  ? 'bg-[#1C1917] text-white shadow-xs'
                  : 'text-[#44403C] hover:bg-[#F2EEE7] hover:text-[#1C1917]'
              }`}
            >
              <Database className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Knowledge Base</span>}
            </button>
          </nav>

          {/* Recent Runs Sublist */}
          {sidebarOpen && history.length > 0 && (
            <div className="pt-4 border-t border-[#E7E2D8] space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#44403C]">Recent Runs</span>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {history.map((run, idx) => (
                  <button
                    key={idx}
                    aria-label={`Open ${run.decision.selected_option}, decision ${run.decision.id}`}
                    onClick={() => openSaved(run)}
                    className="w-full text-left p-2 rounded-lg bg-white/60 hover:bg-white border border-[#E0DACE] text-[11px] text-[#44403C] hover:text-[#1C1917] transition-all truncate"
                  >
                    <div className="font-medium truncate">{run.decision.selected_option}</div>
                    <div className="text-[10px] font-mono text-[#44403C]">{run.timestamp}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-[#E7E2D8] flex items-center justify-between">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#F2EEE7] border border-[#E0DACE] flex items-center justify-center text-xs font-semibold text-[#1C1917]">
                A
              </div>
              <div className="text-xs">
                <div className="font-medium text-[#1C1917]">{username}</div>
                <div className="text-[10px] text-[#44403C]">Executive Profile</div>
              </div>
            </div>
          ) : null}
          <button
            onClick={handleLogout} disabled={authBusy}
            className="p-1.5 rounded-lg text-[#44403C] hover:text-[#1C1917] hover:bg-[#F2EEE7] transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Workspace Area (Offset by Sidebar Width) */}
      <main inert={narrowViewport && sidebarOpen ? true : undefined} className={`flex-1 min-w-0 w-full break-words transition-all duration-300 min-h-screen flex flex-col relative z-10 ${
        sidebarOpen ? 'md:pl-64' : 'md:pl-16'
      }`}>

        {/* Workspace Top Header */}
        <header className="sticky top-0 z-30 border-b border-[#E7E2D8] bg-[#FBF9F5]/90 backdrop-blur-md px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <button ref={navToggle} aria-label="Open navigation" aria-controls="console-navigation" aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)} className="md:hidden p-3 border rounded"><Menu className="w-4 h-4" /></button>
          <div>
            <h2 className="text-sm font-semibold text-[#1C1917] capitalize">
              {activeTab === 'workbench' && 'Positioning Workbench'}
              {activeTab === 'chat' && 'Agent Chat & /triage Bridge'}
              {activeTab === 'history' && 'Decision History'}
              {activeTab === 'digest' && 'On-demand Executive Digest'}
              {activeTab === 'knowledge' && 'Generated Knowledge Summary'}
              {activeTab === 'settings' && 'Runtime Settings'}
            </h2>
            <p className="text-[11px] text-[#44403C]">
              {activeTab === 'workbench' && 'Choose a specialist, submit a goal, and review the result and its risk flags'}
              {activeTab === 'chat' && 'Talk to one agent and its memory, or bridge two without their memories mixing'}
              {activeTab === 'history' && 'Audit trail of past strategy executions and CMO ratifications'}
              {activeTab === 'digest' && 'Cross-agent competitor intelligence, grounded in cited sources'}
              {activeTab === 'knowledge' && 'Generated summaries from the selected result; inspect chat for retrieved facts and admitted memory'}
              {activeTab === 'settings' && 'Model provider configuration and inference limits'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onBackToCaseStudy && (
              <button
                onClick={onBackToCaseStudy}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-[#D4D1C7] bg-white hover:bg-[#F2EEE7] text-[#1C1917] transition-colors"
              >
                ← Return to Showcase
              </button>
            )}
            <p className="text-xs text-[#44403C]">Model configured by server</p>
          </div>
        </header>

        {error && <p role="alert" className="px-6 py-3 text-xs text-red-700">{error}</p>}
        {historyError && <div role="alert" className="px-6 py-3 text-xs text-red-700">
          History unavailable: {historyError} <button onClick={refreshHistory}>Retry history</button>
        </div>}
        {historyLoading && <p role="status" className="px-6 py-2 text-xs">Loading saved decisions…</p>}

        {/* Tab 1: Workbench View */}
        {activeTab === 'workbench' && (
          <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 space-y-6">

            {/* Unified Prompt Input Box */}
            <div className="space-y-3">
              <form
                onSubmit={handleSubmit}
                className="bg-white/90 backdrop-blur-xl border border-[#E7E2D8] focus-within:border-[#D97757] focus-within:ring-2 focus-within:ring-[#D97757]/20 rounded-2xl transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden"
              >
                <div className="p-4">
                  <label htmlFor="business-goal" className="sr-only">Business Goal</label>
                  <textarea id="business-goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={3}
                    required
                    className="w-full bg-transparent border-0 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:ring-0 resize-none leading-relaxed"
                    placeholder="Describe your business goal to trigger positioning development..."
                  />
                </div>

                <div className="px-4 py-3 bg-[#F7F5F0]/90 border-t border-[#E7E2D8] flex flex-wrap items-center justify-end gap-3">
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-block text-[10px] font-mono text-[#44403C]">
                      Press <kbd className="px-1.5 py-0.5 border border-[#E0DACE] rounded bg-white font-sans text-[10px]">⌘</kbd> + <kbd className="px-1.5 py-0.5 border border-[#E0DACE] rounded bg-white font-sans text-[10px]">Enter</kbd>
                    </span>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-[#1C1917] hover:bg-[#44403C] text-white font-medium text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {loading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>{loading ? 'Running...' : 'Run Agent'}</span>
                    </button>
                  </div>
                </div>
              </form>

              <div role="group" aria-label="Select specialist" className="flex flex-wrap items-center gap-2 pb-1 text-xs">
                {AGENTS.map(({ id, label, Icon }) => (
                  <button key={id} type="button" onClick={() => selectAgent(id)} aria-pressed={selectedAgent === id}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${selectedAgent === id ? 'bg-[#1C1917] text-white border-[#D97757]' : 'bg-white text-[#44403C] border-[#E0DACE]'}`}>
                    <Icon className="w-3.5 h-3.5" />{label} Agent
                  </button>
                ))}
              </div>
            </div>

            {loading && <p role="status" className="p-4 text-xs text-[#44403C]">Waiting for the selected agent to return. Progress details are unavailable.</p>}

            {/* Empty Screen Purposely Built CMO Suggestions */}
            {!currentData && !loading && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#44403C]">Purposely Built CMO Executive Scenarios</span>
                  <span className="text-[10px] text-[#44403C]">Click any scenario to load into prompt workbench</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setGoal("Position our GPU cloud compute infrastructure against AWS/Azure without engaging in destructive price wars")}
                    className="p-4 text-left rounded-2xl bg-white/80 hover:bg-white border border-[#E7E2D8] hover:border-[#D97757]/50 transition-all space-y-2 group shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#44403C]" />
                      <h4 className="text-xs font-bold text-[#1C1917] group-hover:text-[#44403C] transition-colors">Hyperscaler Market Entry</h4>
                    </div>
                    <p className="text-xs text-[#44403C] leading-relaxed">Position against AWS/Azure by focusing on AI training capacity without hyperscaler lock-in.</p>
                  </button>

                  <button
                    onClick={() => setGoal("Formulate brand positioning for enterprise SaaS CRM platform targeting Fortune 500 financial institutions requiring strict compliance")}
                    className="p-4 text-left rounded-2xl bg-white/80 hover:bg-white border border-[#E7E2D8] hover:border-[#D97757]/50 transition-all space-y-2 group shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#44403C]" />
                      <h4 className="text-xs font-bold text-[#1C1917] group-hover:text-[#44403C] transition-colors">Enterprise Compliance & SOC2</h4>
                    </div>
                    <p className="text-xs text-[#44403C] leading-relaxed">Establish credibility for high-security CRM platforms targeting regulated financial enterprises.</p>
                  </button>

                  <button
                    onClick={() => setGoal("Position developer API infrastructure for autonomous AI agent developers demanding sub-50ms latencies")}
                    className="p-4 text-left rounded-2xl bg-white/80 hover:bg-white border border-[#E7E2D8] hover:border-[#D97757]/50 transition-all space-y-2 group shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#44403C]" />
                      <h4 className="text-xs font-bold text-[#1C1917] group-hover:text-[#44403C] transition-colors">Sub-50ms Developer Speed</h4>
                    </div>
                    <p className="text-xs text-[#44403C] leading-relaxed">Capture developer mindshare by emphasizing ultra-low latency execution for agentic loops.</p>
                  </button>

                  <button
                    onClick={() => setGoal("Establish market leadership for real-time payment fraud prevention API targeting high-volume e-commerce payment processors")}
                    className="p-4 text-left rounded-2xl bg-white/80 hover:bg-white border border-[#E7E2D8] hover:border-[#D97757]/50 transition-all space-y-2 group shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#44403C]" />
                      <h4 className="text-xs font-bold text-[#1C1917] group-hover:text-[#44403C] transition-colors">Fintech Fraud Prevention</h4>
                    </div>
                    <p className="text-xs text-[#44403C] leading-relaxed">Explore payment-fraud positioning while making unsupported performance claims explicit.</p>
                  </button>
                </div>
              </div>
            )}

            {currentData && !loading && (currentData.workflow_type !== 'run' || !currentData.result_available || !currentData.positioning) && (
              <div className="space-y-3">
                <SavedConversation data={currentData} />
                <ExecutionDetails metrics={currentData.metrics} />
                <DecisionReview decisionId={currentData.decision.id} onUpdated={updateReview} />
              </div>
            )}

            {/* Document Artifact Brief Card */}
            {currentData?.result_available && currentData.workflow_type === 'run' && currentData.positioning && !loading && (
              <div className="bg-white/90 backdrop-blur-xl border border-[#E7E2D8] rounded-2xl p-6 space-y-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] print-artifact relative">

                <ExecutionDetails metrics={currentData.metrics} />
                <DecisionReview decisionId={currentData.decision.id} onUpdated={updateReview} />
                <button onClick={() => {
                  setGoal(`Revise positioning for: ${currentData.goalStatement}`);
                  setCurrentData(null);
                }} className="px-3 py-2 border rounded text-xs">Request AI revision</button>

                {/* Header with Copy, Download, AND Dismiss (X) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D8]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-[#44403C]">Positioning Strategy Brief</span>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold border bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]">
                        STATE: {(currentData.positioning.state || 'Unavailable').toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1C1917] leading-snug">
                      {currentData.decision.selected_option}
                    </h3>
                    <p className="text-xs text-[#44403C]">Submitted goal: {currentData.goalStatement}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 no-print">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F7F5F0] border border-[#E0DACE] text-[#44403C] hover:text-[#1C1917] text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
                      title="Copy Markdown"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#44403C]" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportMd}
                      className="px-3 py-1.5 rounded-xl bg-[#1C1917] hover:bg-[#44403C] text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
                      title="Download Markdown Report"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Report (.md)</span>
                    </button>

                    {/* Explicit Dismiss / Clear Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentData(null)}
                      className="p-1.5 rounded-xl bg-white hover:bg-[#F7F5F0] border border-[#E0DACE] text-[#44403C] hover:text-[#1C1917] transition-all ml-1"
                      title="Dismiss Result / Return to Empty Screen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metric Strip (Clean Wrapping Grid) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#F7F5F0]/90 border border-[#E0DACE] rounded-xl p-3.5 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#44403C]">Selected Strategy</div>
                    <div className="text-xs font-semibold text-[#1C1917] leading-snug break-words">
                      {currentData.decision.selected_option}
                    </div>
                  </div>

                  <div className="bg-[#F7F5F0]/90 border border-[#E0DACE] rounded-xl p-3.5 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#44403C]">Decision Confidence</div>
                    <div className="text-xs font-semibold text-[#1C1917]">
                      {currentData.decision.confidence}
                    </div>
                  </div>

                  <div className="bg-[#F7F5F0]/90 border border-[#E0DACE] rounded-xl p-3.5 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#44403C]">Decision ID</div>
                    <div className="text-[11px] font-mono text-[#44403C] break-all">
                      {currentData.decision.id}
                    </div>
                  </div>

                  <div className="bg-[#F7F5F0]/90 border border-[#E0DACE] rounded-xl p-3.5 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#44403C]">Reasoning Source</div>
                    <div className="text-[11px] font-mono text-[#44403C] font-medium break-all">
                      {currentData.decision.reasoning_source}
                    </div>
                  </div>
                </div>

                {/* Positioning Statement */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#44403C]">Positioning Statement</div>
                  <div className="p-4 rounded-xl bg-[#FDFBF7] border-l-4 border-[#D97757] border border-[#E7E2D8] text-xs text-[#1C1917] font-medium leading-relaxed">
                    {currentData.positioning.statement}
                  </div>
                </div>

                {/* Rationale & Risks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 flex flex-col">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#44403C]">Strategic Rationale</div>
                    <div className="p-3.5 rounded-xl bg-[#F7F5F0]/90 border border-[#E0DACE] text-xs text-[#44403C] leading-relaxed flex-1">
                      {currentData.decision.rationale}
                    </div>
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#44403C]">Identified Risks</div>
                    <div className="p-3.5 rounded-xl bg-[#F7F5F0]/90 border border-[#E0DACE] text-xs text-[#44403C] leading-relaxed flex-1">
                      {currentData.decision.risks}
                    </div>
                  </div>
                </div>

                {/* Knowledge Stream */}
                <div className="space-y-2.5 pt-3 border-t border-[#E7E2D8]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#44403C]">Generated Knowledge Summary</div>
                  <div className="space-y-2">
                    {currentData.knowledge_units.map((ku, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[#F7F5F0]/90 border border-[#E0DACE] flex items-center justify-between text-xs text-[#44403C] gap-3">
                        <span className="font-normal text-[#1C1917] leading-relaxed flex-1">{ku.content}</span>
                        <span className="font-mono text-[10px] uppercase text-[#44403C] border border-[#E0DACE] bg-white px-2 py-0.5 rounded-md shrink-0 font-semibold">
                          {ku.class} / {ku.confidence}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Tab 2: Decision History View */}
        {activeTab === 'chat' && (
          <div className="max-w-6xl w-full min-w-0 mx-auto px-6 py-6">
            <ChatPanel onResult={refreshHistory} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 space-y-4">
            <h3 className="text-sm font-semibold text-[#1C1917]">Execution History ({history.length})</h3>
            {history.length === 0 && !historyError && !historyLoading ? (
              <div className="p-8 text-center bg-white/80 rounded-2xl border border-[#E7E2D8] text-xs text-[#44403C]">
                No decision runs executed yet. Run a goal in the workbench to record history.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white/80 border border-[#E7E2D8] space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1C1917]">{item.decision.selected_option}</span>
                      <span className="text-[10px] font-mono text-[#44403C]">{item.timestamp}</span>
                    </div>
                    <button onClick={() => openSaved(item)} className="text-xs text-[#44403C] underline">Open saved result</button>
                    <p className="text-xs text-[#44403C] bg-[#F7F5F0] p-3 rounded-xl border border-[#E0DACE] leading-relaxed">
                      "{item.positioning?.statement || item.reply || item.answer || 'Original result unavailable for this record.'}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: On-demand Executive Digest (M5) */}
        {activeTab === 'digest' && (
          <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 space-y-6">

            <div className="flex items-center justify-between gap-3 no-print">
              <div>
                <h3 className="text-sm font-semibold text-[#1C1917]">Competitor Intelligence Digest</h3>
                <p className="text-[11px] text-[#44403C]">
                  Fans out to all 5 agents in parallel over {network?.total_facts ?? '—'} source-linked records. This digest runs only when requested.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {digest && (
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-[#E0DACE] bg-white text-[#44403C] hover:text-[#1C1917] hover:bg-[#F2EEE7] transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" /> Save PDF
                  </button>
                )}
                <button
                  onClick={runDigest}
                  disabled={digestLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1C1917] text-white shadow-xs hover:bg-[#44403C] disabled:opacity-60 transition-all"
                >
                  {digestLoading
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Synthesizing…</>
                    : <><Sparkles className="w-3.5 h-3.5" /> {digest ? 'Regenerate' : 'Generate Digest'}</>}
                </button>
              </div>
            </div>

            {digestError && (
              <div role="alert" className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-center gap-2 no-print">
                <AlertCircle className="w-4 h-4 shrink-0" /> {digestError}
              </div>
            )}

            {/* Printable executive report */}
            <div id="digest-report" className="space-y-6">
              {digestLoading && <p role="status" className="text-xs">Waiting for five agent briefs and the digest synthesis…</p>}
              {digest && (
                <>
                  <ExecutionDetails metrics={digest.metrics} />
                  <div className="p-5 rounded-2xl bg-white/80 border border-[#E7E2D8] space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-base font-semibold text-[#1C1917] leading-snug">{digest.headline}</h4>
                      <span className="text-[10px] font-mono text-[#44403C] shrink-0 mt-1">
                        {new Date(digest.generated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#44403C] leading-relaxed">{digest.executive_summary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#44403C]">Competitor Movements</div>
                      <ul className="p-3.5 rounded-xl bg-[#F7F5F0]/90 border border-[#E0DACE] space-y-2">
                        {digest.competitor_movements.map((m, i) => (
                          <li key={i} className="text-xs text-[#44403C] leading-relaxed flex gap-2">
                            <span className="text-[#44403C] font-bold">›</span>{m}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#44403C]">Recommended Actions</div>
                      <ul className="p-3.5 rounded-xl bg-[#F7F5F0]/90 border border-[#E0DACE] space-y-2">
                        {digest.recommended_actions.map((a, i) => (
                          <li key={i} className="text-xs text-[#44403C] leading-relaxed flex gap-2">
                            <span className="text-[#44403C] font-bold">›</span>{a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#44403C]">
                      Specialist Agent Briefs ({digest.agent_briefs.length})
                    </div>
                    <div className="space-y-2">
                      {digest.agent_briefs.map((b) => (
                        <div key={b.agent} className="p-4 rounded-xl bg-white/80 border border-[#E7E2D8] space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-[#1C1917]">{b.headline}</span>
                            <span className="font-mono text-[10px] uppercase text-[#44403C] border border-[#E0DACE] bg-[#F7F5F0] px-2 py-0.5 rounded-md shrink-0">
                              {b.agent.replace('_', ' ')} / {b.confidence}
                            </span>
                          </div>
                          <p className="text-xs text-[#44403C] leading-relaxed">{b.finding}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Link network — grounded, renders with or without a synthesized digest */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#44403C]">Competitor Link Network</div>
                {networkError && <p role="alert" className="text-xs text-red-700">{networkError} <button onClick={() => setNetworkVersion((n) => n + 1)}>Retry network</button></p>}
                {network
                  ? <CompetitorNetwork network={network} />
                  : !networkError && <div role="status" className="p-8 text-center bg-white/80 rounded-2xl border border-[#E7E2D8] text-xs text-[#44403C]">Loading source-linked competitor network…</div>}
              </div>

              {digest && (
                <div className="space-y-2.5 pt-3 border-t border-[#E7E2D8]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#44403C]">
                    Grounded Sources ({digest.citations.length})
                  </div>
                  <p className="text-[11px] text-[#44403C]">
                    Every citation below is a stored knowledge unit with its scraped source URL — never model output.
                  </p>
                  <div className="space-y-1 max-h-72 overflow-y-auto print-expand">
                    {digest.citations.map((c, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-[#F7F5F0]/90 border border-[#E0DACE] flex items-center justify-between gap-3 text-[11px]">
                        <span className="font-medium text-[#1C1917] shrink-0">{c.organization}</span>
                        <span className="font-mono text-[10px] uppercase text-[#44403C] shrink-0">{c.knowledge_class}</span>
                        <a href={c.source_url} target="_blank" rel="noopener noreferrer"
                           className="font-mono text-[10px] text-[#44403C] hover:underline truncate text-right flex-1">
                          {c.source_url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!digest && !digestLoading && (
              <div className="p-8 text-center bg-white/80 rounded-2xl border border-[#E7E2D8] text-xs text-[#44403C] no-print">
                Generate the digest to fan out across all 5 agents and synthesize the executive brief.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Knowledge Base View */}
        {activeTab === 'knowledge' && (
          <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 space-y-4">
            <h3 className="text-sm font-semibold text-[#1C1917]">Generated Knowledge Summary</h3>
            {currentData ? (
              <div className="space-y-2">
                {currentData.knowledge_units.map((ku, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/80 border border-[#E7E2D8] flex items-center justify-between text-xs text-[#1C1917]">
                    <span className="flex-1 leading-relaxed">{ku.content}</span>
                    <span className="font-mono text-[10px] font-semibold text-[#44403C] border border-[#E0DACE] bg-[#F7F5F0] px-2 py-0.5 rounded-md ml-4 shrink-0 uppercase">
                      {ku.class} ({ku.confidence})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white/80 rounded-2xl border border-[#E7E2D8] text-xs text-[#44403C]">
                Run an agent to inspect its generated knowledge summary. This is not the original retrieved corpus or admitted memory.
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
