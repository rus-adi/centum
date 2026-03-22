import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";

function typeBadge(type: string) {
  if (type === "ALERT") return <Badge variant="danger">Alert</Badge>;
  if (type === "ACTION") return <Badge variant="warning">Action</Badge>;
  return <Badge variant="info">Info</Badge>;
}

export default async function NotificationsPage() {
  const { session } = await requireActiveSchool();

  const notes = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  const unread = notes.filter((n) => !n.readAt).length;

  return (
    <PageShell title="Notifications">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {unread > 0 ? `${unread} unread` : "All caught up"} • showing last {notes.length}
        </div>
        <form action={markAllNotificationsRead}>
          <Button type="submit" disabled={unread === 0}>
            Mark all read
          </Button>
        </form>
      </div>

      <div className="mt-4 space-y-3">
        {notes.map((n) => (
          <Card key={n.id} className={n.readAt ? "" : "border-blue-200"}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="truncate">{n.title}</span>
                <span className="flex items-center gap-2">
                  {typeBadge(n.type)}
                  {!n.readAt && <Badge variant="info">Unread</Badge>}
                </span>
              </CardTitle>
              <div className="mt-2 text-xs text-gray-500">{formatDateTime(n.createdAt)}</div>
            </CardHeader>
            <CardContent>
              {n.body && <div className="whitespace-pre-wrap text-sm text-gray-800">{n.body}</div>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {n.link && (
                  <a className="text-sm font-medium text-blue-700 hover:underline" href={n.link}>
                    Open →
                  </a>
                )}
                {!n.readAt && (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <Button type="submit">Mark read</Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {notes.length === 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-gray-50 px-4 py-3 text-sm text-gray-600">
            No notifications yet.
          </div>
        )}
      </div>
    </PageShell>
  );
}
