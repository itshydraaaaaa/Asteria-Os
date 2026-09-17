'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  FolderSync,
  Layers,
  Zap,
  TrendingUp,
  FileCheck,
  PlusCircle,
  FileText,
  Clock,
  ChevronRight,
  ShieldCheck,
  Check,
  Database,
  Eye,
  GitCompare,
} from 'lucide-react';
import type {
  ArchitectureAuditReport,
  BrainUpgradeSuggestion,
  EvolutionStep,
  EvolutionStepStatus,
} from '@/lib/brain-evolution';
import { DataChangesModal } from '@/components/data/DataChangesModal';

export function BrainEvolutionStudio({ initialReport }: { initialReport?: ArchitectureAuditReport }) {
  const [report, setReport] = useState<ArchitectureAuditReport | null>(initialReport || null);
  const [loading, setLoading] = useState(!initialReport);
  const [actingOnId, setActingOnId] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<BrainUpgradeSuggestion | null>(null);
  const [activeTab, setActiveTab] = useState<'UPGRADES' | 'STEPS' | 'LOGS'>('UPGRADES');
  const [statusFilter, setStatusFilter] = useState<'ALL' | EvolutionStepStatus>('ALL');

  // Inspector Modal State
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorData, setInspectorData] = useState<any>(null);
  const [inspectorChanges, setInspectorChanges] = useState<any>(null);
  const [inspectorTitle, setInspectorTitle] = useState('Obsidian Vault & Data Explorer');
  const [inspectorSubtitle, setInspectorSubtitle] = useState('Inspect live note files and architecture diffs');
  const [inspectorTab, setInspectorTab] = useState<'visual' | 'diff' | 'explorer' | 'json'>('explorer');
  const [inspectorTable, setInspectorTable] = useState('obsidian_vault');

  // Custom step modal
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDepartment, setNewStepDepartment] = useState('AI Systems');
  const [newStepDesc, setNewStepDesc] = useState('');


  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/brain/evolution');
      const data = await res.json();
      if (data.ok) {
        setReport(data);
      }
    } catch (e) {
      console.error('Failed to load brain evolution audit', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialReport) {
      fetchAudit();
    }
  }, [initialReport]);

  const handleApplyUpgrade = async (suggestion: BrainUpgradeSuggestion) => {
    setActingOnId(suggestion.id);
    try {
      const res = await fetch('/api/brain/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply_upgrade', suggestionId: suggestion.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setReport(data.report);
        setSelectedSuggestion(null);
      }
    } catch (e) {
      console.error('Failed to apply brain upgrade', e);
    } finally {
      setActingOnId(null);
    }
  };

  const handleProceedStep = async (stepId?: string) => {
    setActingOnId(stepId || 'proceed');
    try {
      const res = await fetch('/api/brain/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'proceed_step', stepId }),
      });
      const data = await res.json();
      if (data.ok) {
        setReport(data.report);
      }
    } catch (e) {
      console.error('Failed to proceed step', e);
    } finally {
      setActingOnId(null);
    }
  };

  const handleUpdateStepStatus = async (stepId: string, status: EvolutionStepStatus) => {
    setActingOnId(stepId);
    try {
      const res = await fetch('/api/brain/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_step_status', stepId, status }),
      });
      const data = await res.json();
      if (data.ok) {
        setReport(data.report);
      }
    } catch (e) {
      console.error('Failed to update step status', e);
    } finally {
      setActingOnId(null);
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;
    setActingOnId('add_step');
    try {
      const res = await fetch('/api/brain/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_step',
          title: newStepTitle,
          department: newStepDepartment,
          description: newStepDesc,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setReport(data.report);
        setShowAddStepModal(false);
        setNewStepTitle('');
        setNewStepDesc('');
      }
    } catch (e) {
      console.error('Failed to add custom step', e);
    } finally {
      setActingOnId(null);
    }
  };

  const filteredSteps = (report?.steps || []).filter((s) => {
    if (statusFilter === 'ALL') return true;
    return s.status === statusFilter;
  });

  const activeStep = report?.steps.find((s) => s.status === 'IN_PROGRESS');

  return (
    <div className="rounded-lg-t border border-os-border bg-os-surface p-5 space-y-6">
      {/* Header & Live Health Score */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-os-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-os-accent font-mono text-xs font-bold text-os-ink">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-base font-bold text-os-text">Brain Evolution & Live Architecture Syncer</h2>
            <span className="rounded-full bg-os-accent/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-os-accent">
              Continuous Revision
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-os-dim">
            Auditing {report?.totalNotesAudited ?? 0} notes across Obsidian & Knowledge Graph · Counting steps & auto-progressing roadmap.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setInspectorData(null);
              setInspectorTitle('Obsidian Vault & Data Explorer');
              setInspectorSubtitle('Explore 130+ Obsidian Vault Notes and Live DB Tables');
              setInspectorTab('explorer');
              setInspectorTable('obsidian_vault');
              setInspectorOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-md border border-os-border bg-os-surface2 px-3 py-1.5 font-mono text-xs text-os-text hover:border-os-accent hover:text-os-accent transition-colors"
          >
            <Database className="h-3.5 w-3.5 text-os-accent" />
            <span>Vault & DB Explorer</span>
          </button>

          <button
            onClick={fetchAudit}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border border-os-border bg-os-surface2 px-3 py-1.5 font-mono text-xs text-os-muted hover:text-os-text hover:bg-os-border/40 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-Audit Brain</span>
          </button>

          <button
            onClick={() => handleProceedStep()}
            disabled={actingOnId === 'proceed'}
            className="flex items-center gap-1.5 rounded-md bg-os-accent px-4 py-1.5 font-mono text-xs font-bold text-os-ink hover:opacity-90 transition-opacity shadow-sm"
          >
            <span>Proceed Next Step</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Metric Banners */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-os-border bg-os-surface2 p-3">
          <div className="font-mono text-[10px] uppercase text-os-dim">Architecture Health</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-os-text">{report?.healthScore ?? 0}%</span>
            <span className="font-mono text-[11px] text-os-ok">Live Sync</span>
          </div>
        </div>

        <div className="rounded-md border border-os-border bg-os-surface2 p-3">
          <div className="font-mono text-[10px] uppercase text-os-dim">Execution Step Progress</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-os-accent">
              {report?.activeStepsCount.completed ?? 0} / {report?.activeStepsCount.total ?? 0}
            </span>
            <span className="font-mono text-[11px] text-os-dim">({report?.completionPercentage ?? 0}%)</span>
          </div>
        </div>

        <div className="rounded-md border border-os-border bg-os-surface2 p-3">
          <div className="font-mono text-[10px] uppercase text-os-dim">Notes Audited</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-os-text">{report?.totalNotesAudited ?? 0}</span>
            <span className="font-mono text-[11px] text-os-dim">Dual Vaults</span>
          </div>
        </div>

        <div className="rounded-md border border-os-border bg-os-surface2 p-3">
          <div className="font-mono text-[10px] uppercase text-os-dim">Active Upgrade Suggestions</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-os-warn">
              {report?.suggestions.filter((s) => !s.applied).length ?? 0}
            </span>
            <span className="font-mono text-[11px] text-os-dim">Available</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between font-mono text-[11px] text-os-dim">
          <span>Roadmap Progression Milestone</span>
          <span className="font-bold text-os-text">{report?.completionPercentage ?? 0}% Completed</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-os-surface2 border border-os-border">
          <div
            className="h-full bg-gradient-to-r from-os-accent to-emerald-400 transition-all duration-500"
            style={{ width: `${report?.completionPercentage ?? 0}%` }}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-os-border pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('UPGRADES')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
              activeTab === 'UPGRADES'
                ? 'bg-os-accent text-os-ink'
                : 'text-os-muted hover:text-os-text hover:bg-os-surface2'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Architecture Upgrades ({report?.suggestions.length ?? 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('STEPS')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
              activeTab === 'STEPS'
                ? 'bg-os-accent text-os-ink'
                : 'text-os-muted hover:text-os-text hover:bg-os-surface2'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Step Tracker & Tasks ({report?.steps.length ?? 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
              activeTab === 'LOGS'
                ? 'bg-os-accent text-os-ink'
                : 'text-os-muted hover:text-os-text hover:bg-os-surface2'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Live Execution Logs</span>
          </button>
        </div>

        {activeTab === 'STEPS' && (
          <button
            onClick={() => setShowAddStepModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-os-border bg-os-surface2 px-2.5 py-1 font-mono text-xs text-os-muted hover:text-os-text transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add Step</span>
          </button>
        )}
      </div>

      {/* TAB 1: Architecture Upgrades & Suggestions */}
      {activeTab === 'UPGRADES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {(report?.suggestions || []).map((sug) => (
              <div
                key={sug.id}
                className={`relative rounded-md border p-4 transition-all ${
                  sug.applied
                    ? 'border-os-ok/30 bg-os-ok/5 opacity-80'
                    : 'border-os-border bg-os-surface2 hover:border-os-accent/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                      sug.priority === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : sug.priority === 'RECOMMENDED'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {sug.priority}
                  </span>

                  <span className="font-mono text-[10.5px] text-os-dim">{sug.category}</span>
                </div>

                <h3 className="mt-2 text-sm font-bold text-os-text">{sug.title}</h3>
                <p className="mt-1 text-xs text-os-muted leading-relaxed">{sug.description}</p>

                <div className="mt-3 flex items-center gap-1.5 font-mono text-[10.5px] text-os-dim truncate">
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate">{sug.targetPath}</span>
                </div>

                <div className="mt-2 rounded bg-black/30 px-2.5 py-1.5 font-mono text-[10.5px] text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 shrink-0" />
                  <span>Impact: {sug.impact}</span>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 border-t border-os-border/50">
                  <button
                    onClick={() => {
                      setInspectorData({
                        id: sug.id,
                        title: sug.title,
                        category: sug.category,
                        priority: sug.priority,
                        targetPath: sug.targetPath,
                        impact: sug.impact,
                        description: sug.description,
                        suggestedContent: sug.suggestedContent,
                      });
                      setInspectorTitle(`Architecture Upgrade Diff: ${sug.title}`);
                      setInspectorSubtitle(`Target Note: ${sug.targetPath} · Impact: ${sug.impact}`);
                      setInspectorTab('diff');
                      setInspectorChanges({
                        before: `Existing note content at ${sug.targetPath}`,
                        after: sug.suggestedContent,
                      });
                      setInspectorOpen(true);
                    }}
                    className="flex items-center gap-1 font-mono text-xs text-os-muted hover:text-os-accent transition-colors"
                  >
                    <GitCompare className="h-3 w-3" />
                    <span>Inspect Code Diff & Data</span>
                  </button>

                  {sug.applied ? (
                    <span className="flex items-center gap-1 font-mono text-xs font-semibold text-os-ok">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Applied to Vault</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApplyUpgrade(sug)}
                      disabled={actingOnId === sug.id}
                      className="flex items-center gap-1.5 rounded bg-os-accent px-3 py-1 font-mono text-xs font-bold text-os-ink hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {actingOnId === sug.id ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <FolderSync className="h-3 w-3" />
                      )}
                      <span>Apply to Brain</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {report?.suggestions.length === 0 && (
            <div className="rounded-md border border-dashed border-os-border p-8 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-os-ok" />
              <p className="mt-2 font-mono text-xs font-semibold text-os-text">
                All Brain architecture nodes are 100% in sync with runtime agents!
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Step Tracker & Tasks ("Always Proceed & Count Our Steps") */}
      {activeTab === 'STEPS' && (
        <div className="space-y-4">
          {/* Status Filter Tabs */}
          <div className="flex gap-2 pb-1">
            {(['ALL', 'IN_PROGRESS', 'PENDING', 'COMPLETED', 'BLOCKED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  statusFilter === st
                    ? 'bg-os-surface2 font-bold text-os-text border border-os-border'
                    : 'text-os-dim hover:text-os-muted'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredSteps.map((step) => {
              const isCurrent = step.status === 'IN_PROGRESS';
              return (
                <div
                  key={step.id}
                  className={`rounded-md border p-4 transition-all ${
                    isCurrent
                      ? 'border-os-accent bg-os-accent/5 shadow-sm'
                      : step.status === 'COMPLETED'
                      ? 'border-os-border bg-os-surface2/60'
                      : 'border-os-border bg-os-surface2'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                          step.status === 'COMPLETED'
                            ? 'bg-os-ok text-os-ink'
                            : isCurrent
                            ? 'bg-os-accent text-os-ink animate-pulse'
                            : 'bg-os-surface border border-os-border text-os-dim'
                        }`}
                      >
                        {step.status === 'COMPLETED' ? <Check className="h-3 w-3" /> : step.stepNumber}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-os-text">{step.title}</h4>
                          <span className="rounded bg-os-surface px-1.5 py-0.5 font-mono text-[10px] text-os-dim border border-os-border">
                            {step.department}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-os-muted">{step.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <select
                        value={step.status}
                        onChange={(e) => handleUpdateStepStatus(step.id, e.target.value as EvolutionStepStatus)}
                        className="rounded border border-os-border bg-os-surface px-2 py-1 font-mono text-xs text-os-text focus:outline-none focus:border-os-accent"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="BLOCKED">BLOCKED</option>
                      </select>

                      {step.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleProceedStep(step.id)}
                          disabled={actingOnId === step.id}
                          className="flex items-center gap-1 rounded bg-os-accent px-2.5 py-1 font-mono text-xs font-bold text-os-ink hover:opacity-90"
                        >
                          <span>Complete Step</span>
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-os-border/50 pt-2 font-mono text-[10.5px] text-os-dim">
                    <span>Metrics: <strong className="text-os-text">{step.metrics}</strong></span>
                    {step.completedAt && (
                      <span className="text-os-ok">Completed: {new Date(step.completedAt).toLocaleTimeString()}</span>
                    )}
                    {step.logs.length > 0 && (
                      <span className="text-os-muted">Latest log: {step.logs[step.logs.length - 1]}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Execution Logs */}
      {activeTab === 'LOGS' && (
        <div className="rounded-md border border-os-border bg-black/40 p-4 font-mono text-xs text-os-text space-y-2 max-h-96 overflow-y-auto">
          <div className="text-[11px] text-os-dim border-b border-os-border pb-2 flex justify-between">
            <span>Asteria Brain Step & Execution Audit Stream</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          {(report?.steps || []).flatMap((s) => s.logs.map((log, idx) => (
            <div key={`${s.id}-${idx}`} className="flex items-start gap-2 text-os-muted">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-os-accent mt-0.5" />
              <span>
                <strong className="text-os-text">[{s.title}]</strong>: {log}
              </span>
            </div>
          )))}
        </div>
      )}

      {/* Modal: View Diff & Suggested Content */}
      {selectedSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-os-border bg-os-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded bg-os-accent/20 px-2 py-0.5 font-mono text-xs font-semibold text-os-accent">
                  {selectedSuggestion.priority} UPGRADE
                </span>
                <h3 className="mt-1 text-base font-bold text-os-text">{selectedSuggestion.title}</h3>
                <p className="font-mono text-xs text-os-dim">{selectedSuggestion.targetPath}</p>
              </div>
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="rounded p-1 text-os-muted hover:text-os-text"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-os-dim">Proposed Markdown Note Content:</label>
              <pre className="max-h-72 overflow-y-auto rounded border border-os-border bg-black/60 p-3 font-mono text-xs text-emerald-300 whitespace-pre-wrap">
                {selectedSuggestion.suggestedContent}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-os-border">
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="rounded px-4 py-1.5 font-mono text-xs text-os-muted hover:text-os-text"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApplyUpgrade(selectedSuggestion)}
                disabled={actingOnId === selectedSuggestion.id}
                className="flex items-center gap-1.5 rounded bg-os-accent px-4 py-1.5 font-mono text-xs font-bold text-os-ink hover:opacity-90"
              >
                <FolderSync className="h-3.5 w-3.5" />
                <span>Apply to Vault Note</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Evolution Step */}
      {showAddStepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={handleAddStep}
            className="w-full max-w-md rounded-lg border border-os-border bg-os-surface p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-base font-bold text-os-text">Add Architecture Step</h3>
              <button
                type="button"
                onClick={() => setShowAddStepModal(false)}
                className="rounded p-1 text-os-muted hover:text-os-text"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-os-dim">Step Title</label>
              <input
                type="text"
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                placeholder="e.g. Expand WhatsApp Inbound Automation"
                className="w-full rounded border border-os-border bg-os-surface2 px-3 py-2 text-xs text-os-text focus:outline-none focus:border-os-accent"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-os-dim">Department</label>
              <select
                value={newStepDepartment}
                onChange={(e) => setNewStepDepartment(e.target.value)}
                className="w-full rounded border border-os-border bg-os-surface2 px-3 py-2 text-xs text-os-text focus:outline-none focus:border-os-accent"
              >
                <option value="AI Systems">AI Systems</option>
                <option value="Growth & Intelligence">Growth & Intelligence</option>
                <option value="Creative & Media">Creative & Media</option>
                <option value="Operations">Operations</option>
                <option value="Revenue">Revenue</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-os-dim">Description / Target Outcome</label>
              <textarea
                value={newStepDesc}
                onChange={(e) => setNewStepDesc(e.target.value)}
                placeholder="Describe the milestone and verification criteria..."
                rows={3}
                className="w-full rounded border border-os-border bg-os-surface2 px-3 py-2 text-xs text-os-text focus:outline-none focus:border-os-accent"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-os-border">
              <button
                type="button"
                onClick={() => setShowAddStepModal(false)}
                className="rounded px-4 py-1.5 font-mono text-xs text-os-muted hover:text-os-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actingOnId === 'add_step'}
                className="flex items-center gap-1.5 rounded bg-os-accent px-4 py-1.5 font-mono text-xs font-bold text-os-ink hover:opacity-90"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Create Step</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Global Data & Changes Inspector Modal */}
      <DataChangesModal
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        title={inspectorTitle}
        subtitle={inspectorSubtitle}
        initialData={inspectorData}
        changes={inspectorChanges}
        defaultTab={inspectorTab}
        tableName={inspectorTable}
      />
    </div>
  );
}

