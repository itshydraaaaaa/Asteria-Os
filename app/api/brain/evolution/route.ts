import { NextResponse } from 'next/server';
import {
  auditBrainArchitecture,
  applyBrainUpgrade,
  proceedNextStep,
  updateStepStatus,
  addEvolutionStep,
} from '@/lib/brain-evolution';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const report = await auditBrainArchitecture();
    return NextResponse.json({ ok: true, ...report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || 'audit';

    if (action === 'audit') {
      const report = await auditBrainArchitecture();
      return NextResponse.json({ ok: true, report });
    }

    if (action === 'apply_upgrade') {
      const { suggestionId, content } = body;
      if (!suggestionId) {
        return NextResponse.json({ ok: false, error: 'suggestionId is required' }, { status: 400 });
      }
      const res = await applyBrainUpgrade(suggestionId, content);
      const updatedAudit = await auditBrainArchitecture();
      return NextResponse.json({ ok: true, result: res, report: updatedAudit });
    }

    if (action === 'proceed_step') {
      const { stepId } = body;
      const res = await proceedNextStep(stepId);
      const updatedAudit = await auditBrainArchitecture();
      return NextResponse.json({ ok: true, result: res, report: updatedAudit });
    }

    if (action === 'update_step_status') {
      const { stepId, status, logMessage } = body;
      if (!stepId || !status) {
        return NextResponse.json({ ok: false, error: 'stepId and status are required' }, { status: 400 });
      }
      const updated = await updateStepStatus(stepId, status, logMessage);
      const updatedAudit = await auditBrainArchitecture();
      return NextResponse.json({ ok: true, step: updated, report: updatedAudit });
    }

    if (action === 'add_step') {
      const { title, department, description } = body;
      if (!title) {
        return NextResponse.json({ ok: false, error: 'title is required' }, { status: 400 });
      }
      const newStep = await addEvolutionStep(title, department || 'General', description || '');
      const updatedAudit = await auditBrainArchitecture();
      return NextResponse.json({ ok: true, step: newStep, report: updatedAudit });
    }

    return NextResponse.json({ ok: false, error: `unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
