import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Copy, Check, FileText, ChevronDown, AlertCircle, LogOut, 
  History, Database, Settings, LayoutDashboard, User, Lock, ArrowRight,
  Eye, EyeOff, Menu, X, ShieldCheck
} from 'lucide-react';
import ShaderCanvas from './components/ShaderCanvas';

const PRESETS = [
  {
    label: "GPU Cloud Compute",
    goal: "Establish credible market position in GPU cloud compute for AI training/inference within 2 quarters"
  },
  {
    label: "Enterprise SaaS CRM",
    goal: "Position our Enterprise SaaS CRM platform for Fortune 500 financial institutions requiring strict compliance"
  },
  {
    label: "Developer API Infra",
    goal: "Launch developer API infrastructure targeting autonomous AI agent developers with sub-50ms latencies"
  },
  {
    label: "Fintech Fraud API",
    goal: "Establish market leadership for real-time fraud detection API targeting high-volume e-commerce payment processors"
  }
];

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [username, setUsername] = useState('admin');
  
  // Login form state
  const [loginUser, setLoginUser] = useState('');
  const [loginPwd, setLoginPwd] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Workspace state
  const [activeTab, setActiveTab] = useState('workbench'); // 'workbench' | 'history' | 'knowledge'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [goal, setGoal] = useState("Establish credible market position in GPU cloud compute for AI training/inference within 2 quarters");
  const [provider, setProvider] = useState("gemini-3.6-flash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [ratified, setRatified] = useState(false);

  // Load persistent history from SQLite on login
  useEffect(() => {
    if (authenticated) {
      fetch('/api/history')
        .then(res => res.json())
        .then(data => {
          if (data.history) {
            const formatted = data.history.map(item => ({
              goalStatement: item.goal_statement,
              timestamp: item.created_at,
              positioning: { statement: item.selected_option, state: 'ACTIVE' },
              decision: {
                id: item.id,
                selected_option: item.selected_option,
                confidence: item.confidence,
                reasoning_source: item.reasoning_source,
                rationale: item.rationale,
                risks: item.risks
              }
            }));
            setHistory(formatted);
          }
        })
        .catch(err => console.error('Failed to load history', err));
    }
  }, [authenticated]);

  // Check auth on load
  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setAuthenticated(true);
          setUsername(data.username || 'admin');
        } else {
          setAuthenticated(false);
        }
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setAuthChecking(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPwd })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Invalid credentials');
      }
      setAuthenticated(true);
      setUsername(data.username || 'admin');
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setAuthenticated(false);
  };

  const [selectedAgent, setSelectedAgent] = useState('branding'); // 'branding' | 'pr'

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!goal.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim(), provider, agent_type: selectedAgent })
      });

      const json = await response.json();

      if (!response.ok || json.error) {
        throw new Error(json.error || 'Workflow execution failed');
      }

      const runRecord = { ...json, goalStatement: goal, timestamp: new Date().toLocaleTimeString() };
      setCurrentData(runRecord);
      setHistory(prev => [runRecord, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleCopy = () => {
    if (!currentData) return;
    const md = `# Positioning Strategy Brief\n\n**Strategy:** ${currentData.decision.selected_option}\n**State:** ${currentData.positioning.state.toUpperCase()}\n**Confidence:** ${currentData.decision.confidence}\n\n## Business Goal\n${currentData.goalStatement}\n\n## Positioning Statement\n${currentData.positioning.statement}\n\n## Strategic Rationale\n${currentData.decision.rationale}\n\n## Identified Risks\n${currentData.decision.risks}\n`;
    
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportMd = async () => {
    if (!currentData) return;
    try {
      const res = await fetch('/api/export/markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentData)
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `positioning-brief-${currentData.decision.id}.md`;
      a.click();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  if (authChecking) {
    return (
      <div className="bg-[#FBF9F5] min-h-screen flex items-center justify-center text-xs text-[#78716C]">
        Loading Marketing OS...
      </div>
    );
  }

  // Render Login Modal if unauthenticated
  if (!authenticated) {
    return (
      <div className="bg-[#FBF9F5] text-[#1C1917] font-sans antialiased min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <ShaderCanvas />

        <div className="w-full max-w-[360px] space-y-6 relative z-10">
          <div className="space-y-1 text-center sm:text-left">
            <h1 class="text-xl font-bold tracking-tight text-[#1C1917]">Marketing OS</h1>
            <p class="text-xs text-[#78716C]">Sign in to access your agent dashboard</p>
          </div>

          <div className="bg-white/85 backdrop-blur-xl border border-[#E7E2D8] rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#44403C]">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
                  <input
                    type="text"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    required
                    autoFocus
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#F7F5F0]/90 border border-[#E0DACE] rounded-xl text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all"
                    placeholder="admin"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#44403C]">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPwd}
                    onChange={(e) => setLoginPwd(e.target.value)}
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-[#F7F5F0]/90 border border-[#E0DACE] rounded-xl text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#44403C] transition-colors p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 bg-[#D97757] hover:bg-[#C15C3D] text-white font-medium text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Render Full Workspace Application with Left Sidebar
  return (
    <div className="bg-[#FBF9F5] text-[#1C1917] font-sans antialiased min-h-screen flex selection:bg-[#D97757]/20 selection:text-[#1C1917] relative overflow-hidden">
      
      {/* 3D WebGL Shader Canvas Background */}
      <ShaderCanvas />

      {/* Left Navigation Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-xl border-r border-[#E7E2D8] transition-all duration-300 flex flex-col justify-between ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className="space-y-6 p-4">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-base tracking-tight text-[#1C1917]">Marketing OS</span>
                <span className="text-[10px] font-mono text-[#78716C] border border-[#E0DACE] px-1.5 py-0.5 rounded bg-[#F2EEE7]">v1.0</span>
              </div>
            ) : (
              <span className="font-bold text-lg text-[#D97757] mx-auto">M</span>
            )}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#F2EEE7] transition-colors"
              title="Toggle Sidebar"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Menu Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('workbench')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'workbench' 
                  ? 'bg-[#D97757] text-white shadow-xs' 
                  : 'text-[#44403C] hover:bg-[#F2EEE7] hover:text-[#1C1917]'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Workbench</span>}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'history' 
                  ? 'bg-[#D97757] text-white shadow-xs' 
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
              onClick={() => setActiveTab('knowledge')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'knowledge' 
                  ? 'bg-[#D97757] text-white shadow-xs' 
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
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C]">Recent Runs</span>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {history.map((run, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentData(run);
                      setGoal(run.goalStatement);
                      setActiveTab('workbench');
                    }}
                    className="w-full text-left p-2 rounded-lg bg-white/60 hover:bg-white border border-[#E0DACE] text-[11px] text-[#44403C] hover:text-[#1C1917] transition-all truncate"
                  >
                    <div className="font-medium truncate">{run.decision.selected_option}</div>
                    <div className="text-[10px] font-mono text-[#A8A29E]">{run.timestamp}</div>
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
                <div className="text-[10px] text-[#78716C]">Executive Profile</div>
              </div>
            </div>
          ) : null}
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#F2EEE7] transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Workspace Area (Offset by Sidebar Width) */}
      <main className={`flex-1 transition-all duration-300 min-h-screen flex flex-col relative z-10 ${
        sidebarOpen ? 'pl-64' : 'pl-16'
      }`}>
        
        {/* Workspace Top Header */}
        <header className="sticky top-0 z-30 border-b border-[#E7E2D8] bg-[#FBF9F5]/90 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#1C1917] capitalize">
              {activeTab === 'workbench' && 'Positioning Workbench'}
              {activeTab === 'history' && 'Decision History'}
              {activeTab === 'knowledge' && 'Semantic Memory Knowledge Base'}
              {activeTab === 'settings' && 'Runtime Settings'}
            </h2>
            <p className="text-[11px] text-[#78716C]">
              {activeTab === 'workbench' && 'Formulate positioning strategies and execute autonomous governance loops'}
              {activeTab === 'history' && 'Audit trail of past strategy executions and CMO ratifications'}
              {activeTab === 'knowledge' && 'Active knowledge units (facts, assumptions, patterns)'}
              {activeTab === 'settings' && 'Model provider configuration and inference limits'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse"></span>
              Gemini 3.6 Flash Active
            </span>
          </div>
        </header>

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
                  <label className="sr-only">Business Goal</label>
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={3}
                    required
                    className="w-full bg-transparent border-0 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:ring-0 resize-none leading-relaxed"
                    placeholder="Describe your business goal to trigger positioning development..."
                  />
                </div>

                <div className="px-4 py-3 bg-[#F7F5F0]/90 border-t border-[#E7E2D8] flex items-center justify-between gap-3">
                  <div className="relative max-w-xs">
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="appearance-none bg-white border border-[#E0DACE] rounded-xl px-3 py-1.5 text-[11px] font-medium text-[#44403C] focus:outline-none focus:border-[#D97757] transition-colors pr-8 cursor-pointer shadow-xs"
                    >
                      <option value="gemini-3.6-flash">Google Gemini 3.6 Flash</option>
                      <option value="gemini-3.5-flash">Google Gemini 3.5 Flash</option>
                      <option value="gemini-3.1-flash-lite">Google Gemini 3.1 Flash Lite</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A8A29E] pointer-events-none" />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-block text-[10px] font-mono text-[#A8A29E]">
                      Press <kbd className="px-1.5 py-0.5 border border-[#E0DACE] rounded bg-white font-sans text-[10px]">⌘</kbd> + <kbd className="px-1.5 py-0.5 border border-[#E0DACE] rounded bg-white font-sans text-[10px]">Enter</kbd>
                    </span>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-[#D97757] hover:bg-[#C15C3D] text-white font-medium text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {loading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>{loading ? 'Running...' : 'Run Pipeline'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Agent Swarm Selector Box */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-mono text-[#78716C] shrink-0 font-semibold uppercase">Swarm Agents:</span>
                <button
                  type="button"
                  onClick={() => setSelectedAgent('branding')}
                  className={`px-3 py-1 rounded-xl border text-[11px] font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                    selectedAgent === 'branding' 
                      ? 'bg-[#D97757] text-white border-[#D97757] shadow-xs' 
                      : 'bg-white/80 hover:bg-white text-[#44403C] border-[#E0DACE]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>🎨 Branding Agent</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAgent('pr')}
                  className={`px-3 py-1 rounded-xl border text-[11px] font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                    selectedAgent === 'pr' 
                      ? 'bg-[#D97757] text-white border-[#D97757] shadow-xs' 
                      : 'bg-white/80 hover:bg-white text-[#44403C] border-[#E0DACE]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>📰 PR Agent</span>
                </button>

                <button type="button" disabled className="px-3 py-1 rounded-xl border border-[#E7E2D8] bg-[#F7F5F0] text-[#A8A29E] text-[11px] font-medium shrink-0 cursor-not-allowed opacity-60">
                  <span>🔮 Social Agent (Phase 2)</span>
                </button>

                <button type="button" disabled className="px-3 py-1 rounded-xl border border-[#E7E2D8] bg-[#F7F5F0] text-[#A8A29E] text-[11px] font-medium shrink-0 cursor-not-allowed opacity-60">
                  <span>🚀 Product Marketing (Phase 2)</span>
                </button>

                <button type="button" disabled className="px-3 py-1 rounded-xl border border-[#E7E2D8] bg-[#F7F5F0] text-[#A8A29E] text-[11px] font-medium shrink-0 cursor-not-allowed opacity-60">
                  <span>🎪 Events Agent (Phase 2)</span>
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-medium flex items-center gap-2.5 backdrop-blur-md">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Live Pipeline Execution Progress Stream */}
            {loading && (
              <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-[#E7E2D8] space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between border-b border-[#E7E2D8] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-[#D97757]/30 border-t-[#D97757] rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-[#1C1917]">Executing Governed AI Agent Pipeline</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#D97757] bg-[#D97757]/10 px-2 py-0.5 rounded-md font-semibold">Active Run</span>
                </div>

                <div className="space-y-2.5 text-xs font-mono text-[#44403C] bg-[#F7F5F0] p-4 rounded-xl border border-[#E0DACE]">
                  <div className="flex items-center gap-2 text-[#059669]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>
                    <span>[01/03] 🔍 Analyzing Business Goal & Semantic Memory Units...</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#D97757]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D97757] animate-ping"></span>
                    <span>[02/03] 💡 Formulating Strategic Positioning Options via {provider}...</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#78716C]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A8A29E]"></span>
                    <span>[03/03] 🛡️ Evaluating Governance Escalation Policy (CMO Profile Gate)...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Empty Screen Purposely Built CMO Suggestions */}
            {!currentData && !loading && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#78716C]">Purposely Built CMO Executive Scenarios</span>
                  <span className="text-[10px] text-[#A8A29E]">Click any scenario to load into prompt workbench</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setGoal("Position our GPU cloud compute infrastructure against AWS/Azure without engaging in destructive price wars")}
                    className="p-4 text-left rounded-2xl bg-white/80 hover:bg-white border border-[#E7E2D8] hover:border-[#D97757]/50 transition-all space-y-2 group shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#D97757]" />
                      <h4 className="text-xs font-bold text-[#1C1917] group-hover:text-[#D97757] transition-colors">Hyperscaler Market Entry</h4>
                    </div>
                    <p className="text-xs text-[#78716C] leading-relaxed">Position against AWS/Azure by focusing on AI training capacity without hyperscaler lock-in.</p>
                  </button>

                  <button 
                    onClick={() => setGoal("Formulate brand positioning for enterprise SaaS CRM platform targeting Fortune 500 financial institutions requiring strict compliance")}
                    className="p-4 text-left rounded-2xl bg-white/80 hover:bg-white border border-[#E7E2D8] hover:border-[#D97757]/50 transition-all space-y-2 group shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#D97757]" />
                      <h4 className="text-xs font-bold text-[#1C1917] group-hover:text-[#D97757] transition-colors">Enterprise Compliance & SOC2</h4>
                    </div>
                    <p className="text-xs text-[#78716C] leading-relaxed">Establish credibility for high-security CRM platforms targeting regulated financial enterprises.</p>
                  </button>

                  <button 
                    onClick={() => setGoal("Position developer API infrastructure for autonomous AI agent developers demanding sub-50ms latencies")}
                    className="p-4 text-left rounded-2xl bg-white/80 hover:bg-white border border-[#E7E2D8] hover:border-[#D97757]/50 transition-all space-y-2 group shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#D97757]" />
                      <h4 className="text-xs font-bold text-[#1C1917] group-hover:text-[#D97757] transition-colors">Sub-50ms Developer Speed</h4>
                    </div>
                    <p className="text-xs text-[#78716C] leading-relaxed">Capture developer mindshare by emphasizing ultra-low latency execution for agentic loops.</p>
                  </button>

                  <button 
                    onClick={() => setGoal("Establish market leadership for real-time payment fraud prevention API targeting high-volume e-commerce payment processors")}
                    className="p-4 text-left rounded-2xl bg-white/80 hover:bg-white border border-[#E7E2D8] hover:border-[#D97757]/50 transition-all space-y-2 group shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#D97757]" />
                      <h4 className="text-xs font-bold text-[#1C1917] group-hover:text-[#D97757] transition-colors">Fintech Fraud Prevention</h4>
                    </div>
                    <p className="text-xs text-[#78716C] leading-relaxed">Demonstrate zero false-positive risk and instant transaction authorization for payment gateways.</p>
                  </button>
                </div>
              </div>
            )}

            {/* Document Artifact Brief Card */}
            {currentData && !loading && (
              <div className="bg-white/90 backdrop-blur-xl border border-[#E7E2D8] rounded-2xl p-6 space-y-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] print-artifact relative">
                
                {/* Human-in-the-Loop Executive Ratification Banner */}
                {ratified ? (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Executive Ratification Complete:</strong> Positioning Brief approved by CMO Gatekeeper ({username})</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-white px-2 py-0.5 rounded font-semibold border border-emerald-200">APPROVED</span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      <span><strong>Executive Gate Active:</strong> Decision confidence is rated <u>{currentData.decision.confidence}</u>. Require CMO ratification?</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setRatified(true)}
                        className="px-3 py-1 bg-[#059669] hover:bg-[#047857] text-white font-medium text-xs rounded-lg transition-colors shadow-xs"
                      >
                        Ratify & Approve
                      </button>
                      <button
                        onClick={() => {
                          setGoal(`Revise positioning for: ${currentData.goalStatement} - focusing more on enterprise compliance`);
                          setCurrentData(null);
                        }}
                        className="px-3 py-1 bg-white hover:bg-[#F7F5F0] text-[#44403C] font-medium text-xs rounded-lg border border-[#E0DACE] transition-colors"
                      >
                        Request AI Revision
                      </button>
                    </div>
                  </div>
                )}

                {/* Header with Copy, Download, AND Dismiss (X) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D8]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-[#78716C]">Positioning Strategy Brief</span>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold border bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]">
                        STATE: {currentData.positioning.state.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1C1917] leading-snug">
                      {currentData.decision.selected_option}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 no-print">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F7F5F0] border border-[#E0DACE] text-[#44403C] hover:text-[#1C1917] text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
                      title="Copy Markdown"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#78716C]" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportMd}
                      className="px-3 py-1.5 rounded-xl bg-[#D97757] hover:bg-[#C15C3D] text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
                      title="Download Markdown Report"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Report (.md)</span>
                    </button>

                    {/* Explicit Dismiss / Clear Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentData(null)}
                      className="p-1.5 rounded-xl bg-white hover:bg-[#F7F5F0] border border-[#E0DACE] text-[#78716C] hover:text-[#1C1917] transition-all ml-1"
                      title="Dismiss Result / Return to Empty Screen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metric Strip (Clean Wrapping Grid) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#F7F5F0]/90 border border-[#E0DACE] rounded-xl p-3.5 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#78716C]">Selected Strategy</div>
                    <div className="text-xs font-semibold text-[#1C1917] leading-snug break-words">
                      {currentData.decision.selected_option}
                    </div>
                  </div>

                  <div className="bg-[#F7F5F0]/90 border border-[#E0DACE] rounded-xl p-3.5 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#78716C]">Decision Confidence</div>
                    <div className="text-xs font-semibold text-[#1C1917]">
                      {currentData.decision.confidence}
                    </div>
                  </div>

                  <div className="bg-[#F7F5F0]/90 border border-[#E0DACE] rounded-xl p-3.5 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#78716C]">Decision ID</div>
                    <div className="text-[11px] font-mono text-[#78716C] break-all">
                      {currentData.decision.id}
                    </div>
                  </div>

                  <div className="bg-[#F7F5F0]/90 border border-[#E0DACE] rounded-xl p-3.5 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#78716C]">Reasoning Source</div>
                    <div className="text-[11px] font-mono text-[#D97757] font-medium break-all">
                      {currentData.decision.reasoning_source}
                    </div>
                  </div>
                </div>

                {/* Positioning Statement */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Positioning Statement</div>
                  <div className="p-4 rounded-xl bg-[#FDFBF7] border-l-4 border-[#D97757] border border-[#E7E2D8] text-xs text-[#1C1917] font-medium leading-relaxed">
                    {currentData.positioning.statement}
                  </div>
                </div>

                {/* Rationale & Risks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 flex flex-col">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Strategic Rationale</div>
                    <div className="p-3.5 rounded-xl bg-[#F7F5F0]/90 border border-[#E0DACE] text-xs text-[#44403C] leading-relaxed flex-1">
                      {currentData.decision.rationale}
                    </div>
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Identified Risks</div>
                    <div className="p-3.5 rounded-xl bg-[#F7F5F0]/90 border border-[#E0DACE] text-xs text-[#44403C] leading-relaxed flex-1">
                      {currentData.decision.risks}
                    </div>
                  </div>
                </div>

                {/* Knowledge Stream */}
                <div className="space-y-2.5 pt-3 border-t border-[#E7E2D8]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Semantic Memory Knowledge Stream</div>
                  <div className="space-y-2">
                    {currentData.knowledge_units.map((ku, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[#F7F5F0]/90 border border-[#E0DACE] flex items-center justify-between text-xs text-[#44403C] gap-3">
                        <span className="font-normal text-[#1C1917] leading-relaxed flex-1">{ku.content}</span>
                        <span className="font-mono text-[10px] uppercase text-[#78716C] border border-[#E0DACE] bg-white px-2 py-0.5 rounded-md shrink-0 font-semibold">
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
        {activeTab === 'history' && (
          <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 space-y-4">
            <h3 className="text-sm font-semibold text-[#1C1917]">Execution History ({history.length})</h3>
            {history.length === 0 ? (
              <div className="p-8 text-center bg-white/80 rounded-2xl border border-[#E7E2D8] text-xs text-[#78716C]">
                No decision runs executed yet. Run a goal in the workbench to record history.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white/80 border border-[#E7E2D8] space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1C1917]">{item.decision.selected_option}</span>
                      <span className="text-[10px] font-mono text-[#78716C]">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-[#44403C] bg-[#F7F5F0] p-3 rounded-xl border border-[#E0DACE] leading-relaxed">
                      "{item.positioning.statement}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Knowledge Base View */}
        {activeTab === 'knowledge' && (
          <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 space-y-4">
            <h3 className="text-sm font-semibold text-[#1C1917]">Semantic Knowledge Base</h3>
            {currentData ? (
              <div className="space-y-2">
                {currentData.knowledge_units.map((ku, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/80 border border-[#E7E2D8] flex items-center justify-between text-xs text-[#1C1917]">
                    <span className="flex-1 leading-relaxed">{ku.content}</span>
                    <span className="font-mono text-[10px] font-semibold text-[#78716C] border border-[#E0DACE] bg-[#F7F5F0] px-2 py-0.5 rounded-md ml-4 shrink-0 uppercase">
                      {ku.class} ({ku.confidence})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white/80 rounded-2xl border border-[#E7E2D8] text-xs text-[#78716C]">
                Execute a positioning workflow to inspect generated semantic memory units.
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
