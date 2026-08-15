import { getDb } from '@/lib/data';
import { PageHeader } from '@/components/PageHeader';
import { CommandChatView } from '@/components/CommandChatView';
import { Badge } from '@/components/terminal';

export const dynamic = 'force-dynamic';

export default function CommandChatPage() {
  const db = getDb();
  const agents = db.agents.all().map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="operator control"
        title="Command Chat"
        right={<Badge tone="accent">{agents.length} Agents Ready</Badge>}
      />
      <CommandChatView agents={agents} />
    </div>
  );
}
