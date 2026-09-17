'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Database,
  FileText,
  Copy,
  Check,
  Download,
  Search,
  ArrowRight,
  GitCompare,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  ChevronRight,
  Code2,
  Table as TableIcon,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  Shield,
  Filter,
} from 'lucide-react';

export type ChangeItem = {
  key?: string;
  before?: any;
  after?: any;
  summary?: string;
  timestamp?: string;
};

export type DataInspectorProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  initialData?: any;
  changes?: ChangeItem | ChangeItem[];
  defaultTab?: 'visual' | 'diff' | 'explorer' | 'json';
  tableName?: string;
};

const AVAILABLE_TABLES = [
  { id: 'agent_runs', label: 'Agent Runs', icon: Activity, desc: 'Execution logs, tool calls & tokens' },
  { id: 'agent_messages', label: 'Chat Messages', icon: FileText, desc: 'Persisted conversation history' },
  { id: 'obsidian_vault', label: 'Obsidian Vault', icon: Sparkles, desc: '130+ indexed brain notes' },
  { id: 'social_posts', label: 'Social Posts', icon: Layers, desc: 'Scheduled & published posts' },
  { id: 'funnel_contacts', label: 'Funnel Contacts', icon: Filter, desc: 'Leads & journey touchpoints' },
  { id: 'roadmap_items', label: 'Roadmap Tasks', icon: TableIcon, desc: 'Quarterly initiatives' },
  { id: 'metrics', label: 'Metrics & KPIs', icon: Activity, desc: 'Live business & platform stats' },
  { id: 'sops', label: 'SOPs', icon: Shield, desc: 'Standard operating procedures' },
  { id: 'tools', label: 'Agent Tools', icon: Code2, desc: 'Tool schemas & capabilities' },
];

export function DataChangesModal({
  isOpen,
  onClose,
  title = 'Data & Changes Explorer',
  subtitle = 'Inspect live system data, execution outputs, and state diffs',
  initialData,
  changes,
  defaultTab = 'visual',
  tableName: initialTableName,
}: DataInspectorProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'diff' | 'explorer' | 'json'>(defaultTab);
  const [copied, setCopied] = useState(false);
  const [selectedTable, setSelectedTable] = useState(initialTableName || 'agent_runs');
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableStats, setTableStats] = useState<Record<string, number>>({});
  const [tableLoading, setTableLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [diffMode, setDiffMode] = useState<'side' | 'unified'>('side');

  // Sync tab when opened with specific mode
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      if (initialData) {
        setSelectedRow(initialData);
      }
    }
  }, [isOpen, defaultTab, initialData]);

  // Fetch table data when explorer tab is opened or table changes
  const fetchTableData = async (tbl: string) => {
    setTableLoading(true);
    try {
      const res = await fetch(`/api/data/explorer?table=${tbl}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setTableData(data.rows || []);
        if (data.stats) setTableStats(data.stats);
        if (data.rows && data.rows.length > 0 && !selectedRow) {
          setSelectedRow(data.rows[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch table data', err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && (activeTab === 'explorer' || !initialData)) {
      fetchTableData(selectedTable);
    }
  }, [isOpen, activeTab, selectedTable]);

  const currentDisplayData = selectedRow || initialData || tableData[0] || null;

  const handleCopyJson = () => {
    const text = JSON.stringify(currentDisplayData, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentDisplayData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `asteria-${selectedTable || 'data'}-${Date.now()}.json`);
    dlAnchor.click();
  };

  // Filtered rows for explorer
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return tableData;
    const q = searchQuery.toLowerCase();
    return tableData.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [tableData, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-2xl border border-os-border bg-os-surface shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-os-border bg-os-surface2 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-os-accent/15 border border-os-accent/30 text-os-accent">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-os-text">{title}</h2>
                <span className="rounded-full bg-os-ok/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-os-ok">
                  ● Live Sync
                </span>
              </div>
              <p className="text-xs text-os-dim">{subtitle}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center rounded-lg border border-os-border bg-os-surface p-1">
            <button
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                activeTab === 'visual'
                  ? 'bg-os-accent text-os-ink font-bold shadow-sm'
                  : 'text-os-muted hover:text-os-text'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Visual Data</span>
            </button>

            <button
              onClick={() => setActiveTab('diff')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                activeTab === 'diff'
                  ? 'bg-os-accent text-os-ink font-bold shadow-sm'
                  : 'text-os-muted hover:text-os-text'
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              <span>Changes & Diff</span>
            </button>

            <button
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                activeTab === 'explorer'
                  ? 'bg-os-accent text-os-ink font-bold shadow-sm'
                  : 'text-os-muted hover:text-os-text'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>DB & Vault Explorer</span>
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                activeTab === 'json'
                  ? 'bg-os-accent text-os-ink font-bold shadow-sm'
                  : 'text-os-muted hover:text-os-text'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Raw JSON</span>
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1 rounded-md border border-os-border bg-os-surface px-2.5 py-1.5 font-mono text-xs text-os-text transition-colors hover:border-os-accent"
              title="Copy JSON Payload"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-os-ok" /> : <Copy className="h-3.5 w-3.5 text-os-muted" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={handleExportJson}
              className="flex items-center gap-1 rounded-md border border-os-border bg-os-surface px-2.5 py-1.5 font-mono text-xs text-os-text transition-colors hover:border-os-accent"
              title="Export to JSON file"
            >
              <Download className="h-3.5 w-3.5 text-os-muted" />
              <span>Export</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-os-muted hover:bg-os-border/50 hover:text-os-text transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* TAB 1: VISUAL DATA VIEW */}
          {activeTab === 'visual' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {currentDisplayData ? (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
                    <div className="rounded-xl border border-os-border bg-os-surface2 p-4">
                      <div className="text-[11px] uppercase text-os-dim">Data Type / Entity</div>
                      <div className="mt-1 text-sm font-bold text-os-accent truncate">
                        {currentDisplayData.agentId ? `@${currentDisplayData.agentId}` : currentDisplayData.path || currentDisplayData.title || currentDisplayData.id || 'Record'}
                      </div>
                    </div>

                    <div className="rounded-xl border border-os-border bg-os-surface2 p-4">
                      <div className="text-[11px] uppercase text-os-dim">Status / Health</div>
                      <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-os-ok">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{currentDisplayData.status || currentDisplayData.ok !== undefined ? (currentDisplayData.ok ? 'SUCCESS' : 'FAILED') : 'ACTIVE'}</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-os-border bg-os-surface2 p-4">
                      <div className="text-[11px] uppercase text-os-dim">Execution Time / Date</div>
                      <div className="mt-1 text-xs font-semibold text-os-text truncate">
                        {currentDisplayData.startedAt || currentDisplayData.createdAt || currentDisplayData.at || new Date().toLocaleString()}
                      </div>
                    </div>

                    <div className="rounded-xl border border-os-border bg-os-surface2 p-4">
                      <div className="text-[11px] uppercase text-os-dim">Tokens / Size</div>
                      <div className="mt-1 text-sm font-bold text-os-text">
                        {currentDisplayData.tokensUsed ? `${currentDisplayData.tokensUsed} tokens` : currentDisplayData.length ? `${currentDisplayData.length} chars` : 'Structured JSON'}
                      </div>
                    </div>
                  </div>

                  {/* Visual Fields & Values Table */}
                  <div className="rounded-xl border border-os-border bg-os-surface2/60 overflow-hidden">
                    <div className="border-b border-os-border px-4 py-3 font-mono text-xs font-bold text-os-text flex items-center justify-between">
                      <span>Field Properties & Attributes</span>
                      <span className="text-[11px] text-os-dim font-normal">
                        {Object.keys(currentDisplayData).length} attributes
                      </span>
                    </div>

                    <div className="divide-y divide-os-border">
                      {Object.entries(currentDisplayData).map(([key, val]) => (
                        <div key={key} className="flex flex-col md:flex-row p-4 gap-4 hover:bg-os-surface2/40">
                          <div className="w-48 font-mono text-xs font-semibold text-os-accent truncate shrink-0">
                            {key}
                          </div>
                          <div className="flex-1 text-xs text-os-text font-mono break-all">
                            {typeof val === 'object' && val !== null ? (
                              <pre className="rounded bg-black/40 p-3 text-[11.5px] text-emerald-300 overflow-x-auto whitespace-pre-wrap max-h-60">
                                {JSON.stringify(val, null, 2)}
                              </pre>
                            ) : typeof val === 'string' && val.length > 100 ? (
                              <div className="rounded bg-black/30 p-3 whitespace-pre-wrap text-os-text leading-relaxed font-sans text-xs max-h-60 overflow-y-auto">
                                {val}
                              </div>
                            ) : (
                              <span className="font-semibold">{String(val)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center text-os-dim font-mono text-xs">
                  <Database className="h-8 w-8 mb-2 opacity-40" />
                  <span>No data selected. Switch to DB Explorer to select records.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHANGES & DIFF VIEW */}
          {activeTab === 'diff' && (
            <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-os-text">
                  <GitCompare className="h-4 w-4 text-os-accent" />
                  <span className="font-bold">State Changes & Delta Inspector</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-os-dim">Layout:</span>
                  <button
                    onClick={() => setDiffMode('side')}
                    className={`rounded px-2.5 py-1 font-mono text-xs ${
                      diffMode === 'side' ? 'bg-os-accent text-os-ink font-bold' : 'border border-os-border text-os-dim'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    onClick={() => setDiffMode('unified')}
                    className={`rounded px-2.5 py-1 font-mono text-xs ${
                      diffMode === 'unified' ? 'bg-os-accent text-os-ink font-bold' : 'border border-os-border text-os-dim'
                    }`}
                  >
                    Unified Delta
                  </button>
                </div>
              </div>

              {/* Side by side diff */}
              {diffMode === 'side' ? (
                <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                  {/* Before State */}
                  <div className="flex flex-col rounded-xl border border-red-500/30 bg-red-950/10 overflow-hidden">
                    <div className="border-b border-red-500/30 bg-red-950/30 px-4 py-2 font-mono text-xs font-bold text-red-400 flex items-center justify-between">
                      <span>─ Previous / Input State</span>
                      <span className="text-[10px] uppercase font-normal">Original</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-red-200 whitespace-pre-wrap">
                      {changes && !Array.isArray(changes) && changes.before ? (
                        typeof changes.before === 'string' ? changes.before : JSON.stringify(changes.before, null, 2)
                      ) : currentDisplayData?.input ? (
                        typeof currentDisplayData.input === 'string' ? currentDisplayData.input : JSON.stringify(currentDisplayData.input, null, 2)
                      ) : (
                        <div className="text-os-dim italic">Baseline state initialized prior to execution.</div>
                      )}
                    </div>
                  </div>

                  {/* After State */}
                  <div className="flex flex-col rounded-xl border border-emerald-500/30 bg-emerald-950/10 overflow-hidden">
                    <div className="border-b border-emerald-500/30 bg-emerald-950/30 px-4 py-2 font-mono text-xs font-bold text-emerald-400 flex items-center justify-between">
                      <span>+ Mutated / Generated State</span>
                      <span className="text-[10px] uppercase font-normal">Applied</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-emerald-200 whitespace-pre-wrap">
                      {changes && !Array.isArray(changes) && changes.after ? (
                        typeof changes.after === 'string' ? changes.after : JSON.stringify(changes.after, null, 2)
                      ) : currentDisplayData?.output ? (
                        typeof currentDisplayData.output === 'string' ? currentDisplayData.output : JSON.stringify(currentDisplayData.output, null, 2)
                      ) : currentDisplayData?.content ? (
                        currentDisplayData.content
                      ) : (
                        <pre className="text-emerald-300">{JSON.stringify(currentDisplayData, null, 2)}</pre>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Unified Diff */
                <div className="flex-1 flex flex-col rounded-xl border border-os-border bg-black/60 overflow-hidden">
                  <div className="border-b border-os-border bg-os-surface2 px-4 py-2 font-mono text-xs font-bold text-os-text">
                    Unified Changes Feed
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
                    {currentDisplayData?.input && (
                      <div className="bg-red-950/20 text-red-300 p-2 rounded border-l-2 border-red-500">
                        <span className="font-bold">- [INPUT]: </span>
                        {typeof currentDisplayData.input === 'string' ? currentDisplayData.input : JSON.stringify(currentDisplayData.input)}
                      </div>
                    )}
                    {currentDisplayData?.output && (
                      <div className="bg-emerald-950/20 text-emerald-300 p-2 rounded border-l-2 border-emerald-500">
                        <span className="font-bold">+ [OUTPUT]: </span>
                        {typeof currentDisplayData.output === 'string' ? currentDisplayData.output : JSON.stringify(currentDisplayData.output)}
                      </div>
                    )}
                    {currentDisplayData?.summary && (
                      <div className="bg-blue-950/20 text-blue-300 p-2 rounded border-l-2 border-blue-500">
                        <span className="font-bold">⚡ [SUMMARY]: </span>
                        {currentDisplayData.summary}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE DB & VAULT EXPLORER */}
          {activeTab === 'explorer' && (
            <div className="flex flex-1 overflow-hidden">
              {/* Table Selector Sidebar */}
              <div className="w-64 border-r border-os-border bg-os-surface2/50 flex flex-col overflow-y-auto">
                <div className="p-3 border-b border-os-border font-mono text-xs font-bold text-os-text uppercase tracking-wider">
                  Tables & Vaults
                </div>
                <div className="p-2 space-y-1">
                  {AVAILABLE_TABLES.map((tbl) => {
                    const Icon = tbl.icon;
                    const count = tableStats[tbl.id];
                    const isSelected = selectedTable === tbl.id;
                    return (
                      <button
                        key={tbl.id}
                        onClick={() => setSelectedTable(tbl.id)}
                        className={`w-full flex items-center justify-between rounded-lg p-2.5 text-left font-mono text-xs transition-colors ${
                          isSelected
                            ? 'bg-os-accent text-os-ink font-bold'
                            : 'text-os-text hover:bg-os-surface2'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{tbl.label}</span>
                        </div>
                        {count !== undefined && (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                              isSelected ? 'bg-os-ink/20 text-os-ink' : 'bg-os-border text-os-dim'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Table Records List & Details */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search Bar */}
                <div className="flex items-center gap-3 border-b border-os-border bg-os-surface2 px-4 py-2.5">
                  <Search className="h-4 w-4 text-os-dim shrink-0" />
                  <input
                    type="text"
                    placeholder={`Search ${selectedTable} records...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent font-mono text-xs text-os-text outline-none"
                  />
                  <button
                    onClick={() => fetchTableData(selectedTable)}
                    className="rounded p-1 text-os-muted hover:text-os-text"
                    title="Refresh Table"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${tableLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Rows & Preview Split */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden divide-x divide-os-border">
                  {/* Left Column: List of rows */}
                  <div className="overflow-y-auto p-3 space-y-2">
                    {tableLoading ? (
                      <div className="flex h-40 items-center justify-center font-mono text-xs text-os-dim">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        <span>Loading {selectedTable}...</span>
                      </div>
                    ) : filteredRows.length === 0 ? (
                      <div className="p-8 text-center font-mono text-xs text-os-dim">
                        No records found matching query.
                      </div>
                    ) : (
                      filteredRows.map((row, idx) => {
                        const isSelected = selectedRow?.id === row.id || (selectedRow === row);
                        const label = row.name || row.title || row.agentId || row.path || row.id || `Row #${idx + 1}`;
                        const sub = row.summary || row.snippet || row.role || row.caption || row.status || '';

                        return (
                          <div
                            key={row.id || idx}
                            onClick={() => setSelectedRow(row)}
                            className={`cursor-pointer rounded-lg border p-3 font-mono transition-colors ${
                              isSelected
                                ? 'border-os-accent bg-os-accent/10 shadow-sm'
                                : 'border-os-border bg-os-surface hover:bg-os-surface2'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-os-text truncate">{label}</span>
                              {row.status && (
                                <span className="rounded bg-os-border px-1.5 py-0.5 text-[9.5px] uppercase text-os-accent font-semibold">
                                  {row.status}
                                </span>
                              )}
                            </div>
                            {sub && <p className="mt-1 text-[11px] text-os-dim line-clamp-1">{sub}</p>}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Right Column: Selected Row Visual Preview */}
                  <div className="overflow-y-auto p-4 bg-os-surface2/30 space-y-4">
                    {selectedRow ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-os-border pb-2">
                          <span className="font-mono text-xs font-bold text-os-accent">
                            Record Detail Inspector
                          </span>
                          <button
                            onClick={() => setActiveTab('json')}
                            className="font-mono text-[10.5px] text-os-dim hover:text-os-accent underline"
                          >
                            View as Raw JSON →
                          </button>
                        </div>

                        <div className="space-y-3 font-mono text-xs">
                          {Object.entries(selectedRow).map(([k, v]) => (
                            <div key={k} className="rounded border border-os-border bg-os-surface p-2.5">
                              <div className="text-[10px] uppercase text-os-accent font-semibold mb-1">{k}</div>
                              <div className="text-xs text-os-text break-all">
                                {typeof v === 'object' && v !== null ? (
                                  <pre className="text-[11px] text-emerald-300 whitespace-pre-wrap">
                                    {JSON.stringify(v, null, 2)}
                                  </pre>
                                ) : (
                                  String(v)
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center font-mono text-xs text-os-dim">
                        Select a record from the list to inspect details.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RAW JSON VIEW */}
          {activeTab === 'json' && (
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="rounded-xl border border-os-border bg-black/80 p-5 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(currentDisplayData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
