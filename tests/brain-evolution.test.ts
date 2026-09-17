import { describe, expect, test } from 'vitest';
import {
  auditBrainArchitecture,
  proceedNextStep,
  updateStepStatus,
  addEvolutionStep,
} from '@/lib/brain-evolution';

describe('Brain Evolution & Architecture Auditor', () => {
  test('auditBrainArchitecture returns a comprehensive report with health score and steps', async () => {
    const report = await auditBrainArchitecture();
    expect(report.healthScore).toBeGreaterThanOrEqual(0);
    expect(report.healthScore).toBeLessThanOrEqual(100);
    expect(report.totalNotesAudited).toBeGreaterThanOrEqual(0);
    expect(report.steps.length).toBeGreaterThanOrEqual(5);
    expect(report.activeStepsCount.total).toBe(report.steps.length);
    expect(report.completionPercentage).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(report.suggestions)).toBe(true);
  });

  test('proceedNextStep advances execution step tracker', async () => {
    const res = await proceedNextStep();
    expect(res.allSteps.length).toBeGreaterThan(0);
    const completed = res.allSteps.filter((s) => s.status === 'COMPLETED');
    expect(completed.length).toBeGreaterThan(0);
  });

  test('updateStepStatus updates individual step lifecycle and appends logs', async () => {
    const steps = (await auditBrainArchitecture()).steps;
    const firstStep = steps[0];
    const updated = await updateStepStatus(firstStep.id, 'COMPLETED', 'Verification passed');
    expect(updated.status).toBe('COMPLETED');
    expect(updated.logs.some((l) => l.includes('Verification passed'))).toBe(true);
  });

  test('addEvolutionStep dynamically adds a milestone to the step roadmap', async () => {
    const newStep = await addEvolutionStep('Custom SOP Integration', 'Operations', 'Test milestone');
    expect(newStep.title).toBe('Custom SOP Integration');
    expect(newStep.department).toBe('Operations');
    expect(newStep.status).toBe('PENDING');

    const audit = await auditBrainArchitecture();
    expect(audit.steps.some((s) => s.id === newStep.id)).toBe(true);
  });
});
