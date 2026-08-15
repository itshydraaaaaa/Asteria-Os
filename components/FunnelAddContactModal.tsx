'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export function FunnelAddContactModal({ onAdded }: { onAdded?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [amountUsd, setAmountUsd] = useState('5000');
  const [status, setStatus] = useState('prospect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          role: role.trim(),
          email: email.trim(),
          amountUsd: Number(amountUsd) || 0,
          status,
        }),
      });
      if (res.ok) {
        setName('');
        setCompany('');
        setRole('');
        setEmail('');
        setIsOpen(false);
        if (onAdded) onAdded();
        window.location.reload();
      }
    } catch {
      /* network error */
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-1.5 font-mono text-[11px] font-medium text-os-accent transition-colors hover:bg-os-surface2"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Lead
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-os-border bg-os-bg p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-os-text">
                Add New Client Lead
              </span>
              <button onClick={() => setIsOpen(false)} className="text-os-dim hover:text-os-text">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase text-os-dim">Client / Person Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-os-border bg-os-surface px-3 py-1.5 text-xs text-os-text outline-none focus:border-os-accent"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase text-os-dim">Company</label>
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full rounded-md border border-os-border bg-os-surface px-3 py-1.5 text-xs text-os-text outline-none focus:border-os-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase text-os-dim">Role</label>
                  <input
                    type="text"
                    placeholder="Founder / CEO"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-md border border-os-border bg-os-surface px-3 py-1.5 text-xs text-os-text outline-none focus:border-os-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase text-os-dim">Email</label>
                  <input
                    type="email"
                    placeholder="client@acme.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-os-border bg-os-surface px-3 py-1.5 text-xs text-os-text outline-none focus:border-os-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase text-os-dim">Est. Value ($)</label>
                  <input
                    type="number"
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(e.target.value)}
                    className="w-full rounded-md border border-os-border bg-os-surface px-3 py-1.5 text-xs text-os-text outline-none focus:border-os-accent"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase text-os-dim">Pipeline Stage</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-md border border-os-border bg-os-surface px-3 py-1.5 text-xs text-os-text outline-none focus:border-os-accent"
                >
                  <option value="prospect">First Contact / Prospect</option>
                  <option value="engaged">Discovery Call / Engaged</option>
                  <option value="proposal">Proposal Sent</option>
                  <option value="negotiating">Contract / Negotiating</option>
                  <option value="converted">Closed Client (Converted)</option>
                </select>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-os-border px-3 py-1.5 font-mono text-xs text-os-muted hover:text-os-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-os-accent px-4 py-1.5 font-mono text-xs font-bold text-os-accent-ink transition-opacity hover:opacity-90"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
