import { getDb } from '@/lib/data';
import { groupRoadmapByQuarter } from '@/lib/roadmap';
import { PageHeader } from '@/components/PageHeader';
import { SectionHead } from '@/components/terminal';
import { RoadmapBoard } from '@/components/RoadmapBoard';

export const dynamic = 'force-dynamic';

export default function RoadmapPage() {
  const db = getDb();
  const quarters = groupRoadmapByQuarter(db.roadmap.all());
  const phases = db.phases.all();
  const departmentsMap: Record<string, string> = {};
  for (const d of db.departments.all()) {
    departmentsMap[d.id] = d.name;
  }

  return (
    <div>
      <PageHeader
        eyebrow="build plan"
        title="Roadmap"
      />

      {/* High-level functionality phases */}
      <section className="mb-9">
        <SectionHead label="Phases" count={phases.length} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 ultra:grid-cols-6">
          {phases.map((phase) => (
            <div key={phase.id} className="rounded-lg-t border border-os-border bg-os-surface px-[17px] py-[15px]">
              <div className="mb-[7px] font-mono text-[10px] tracking-[0.18em] text-os-accent">
                PHASE {String(phase.number).padStart(2, '0')}
              </div>
              <h2 className="text-sm font-bold">{phase.title}</h2>
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-baseline gap-2 text-[11.5px] text-os-muted">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-os-dim" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Quarterly columns */}
      <SectionHead label="Quarter by quarter" />
      <RoadmapBoard initialQuarters={quarters} departmentsMap={departmentsMap} />
    </div>
  );
}
