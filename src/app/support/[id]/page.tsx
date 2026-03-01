import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import {
  addTicketComment,
  assignTicket,
  deleteTicket,
  updateTicketStatus
} from "@/app/actions/tickets";
import { uploadTicketAttachment } from "@/app/actions/attachments";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import { canDelete, canResolveRequests } from "@/lib/rbac";

function statusBadge(status: string) {
  if (status === "COMPLETED") return <Badge variant="success">Completed</Badge>;
  if (status === "IN_PROGRESS") return <Badge variant="info">In progress</Badge>;
  return <Badge variant="warning">Open</Badge>;
}

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const { session, schoolId } = await requireActiveSchool();
  const role = session.user.role as any;

  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, schoolId },
    include: {
      submittedBy: true,
      assignedTo: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      events: { include: { actor: true }, orderBy: { createdAt: "asc" } },
      attachments: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } }
    }
  });

  if (!ticket) return notFound();

  const canResolve = canResolveRequests(role);
  const canRemove = canDelete(role);

  const assignees = await prisma.user.findMany({
    where: { schoolId, active: true, role: { in: ["ADMIN", "IT"] } },
    orderBy: { name: "asc" }
  });

  return (
    <PageShell title="Ticket Detail">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/support" className="text-sm font-medium text-blue-700 hover:underline">
          ← Back to Support
        </Link>
        <div>{statusBadge(ticket.status)}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{ticket.subject}</CardTitle>
            <p className="mt-2 text-sm text-gray-600">Category: {ticket.category}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500">Submitted by</div>
                <div className="font-medium text-gray-900">{ticket.submittedBy?.name ?? "—"}</div>
              </div>
              <div>
                <div className="text-gray-500">Assigned to</div>
                <div className="font-medium text-gray-900">{ticket.assignedTo?.name ?? "—"}</div>
              </div>
              <div>
                <div className="text-gray-500">Created</div>
                <div className="text-gray-900">{formatDateTime(ticket.createdAt)}</div>
              </div>
              <div>
                <div className="text-gray-500">Description</div>
                <div className="whitespace-pre-wrap text-gray-900">{ticket.description}</div>
              </div>
            </div>

            {canResolve && (
              <div className="mt-6 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <form action={assignTicket.bind(null, ticket.id)} className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Assign</div>
                    <Select name="assignedToId" defaultValue={ticket.assignedToId ?? ""}>
                      <option value="">Unassigned</option>
                      {assignees.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </Select>
                    <Button className="w-full" type="submit">
                      Update assignment
                    </Button>
                  </form>

                  <form action={updateTicketStatus.bind(null, ticket.id)} className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Status</div>
                    <Select name="status" defaultValue={ticket.status}>
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </Select>
                    <Button className="w-full" type="submit">
                      Update status
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {canRemove && (
              <div className="mt-6">
                <ConfirmActionForm
                  action={deleteTicket.bind(null, ticket.id)}
                  confirmMessage="Delete this ticket permanently?"
                >
                  <Button variant="danger" type="submit">
                    Delete ticket
                  </Button>
                </ConfirmActionForm>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ticket.events.map((e) => (
                  <div key={e.id} className="rounded-lg border border-[var(--border)] px-3 py-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>{e.actor?.name ?? "System"}</div>
                      <div>{formatDateTime(e.createdAt)}</div>
                    </div>
                    <div className="mt-1 text-sm text-gray-800">{e.message}</div>
                    <div className="mt-1 text-[11px] text-gray-500 font-mono">{e.type}</div>
                  </div>
                ))}
                {ticket.events.length === 0 && <div className="text-sm text-gray-500">No timeline events yet.</div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={uploadTicketAttachment.bind(null, ticket.id)} encType="multipart/form-data" className="flex items-center gap-2">
                <input type="file" name="file" required />
                <Button type="submit">Upload</Button>
              </form>

              <div className="mt-4 space-y-2">
                {ticket.attachments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-gray-900">{a.filename}</div>
                      <div className="text-xs text-gray-500">
                        {a.uploadedBy?.name ?? "Unknown"} • {formatDateTime(a.createdAt)} • {(a.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <a className="text-blue-700 hover:underline" href={`/api/attachments/${a.id}`}>
                      Download
                    </a>
                  </div>
                ))}
                {ticket.attachments.length === 0 && <div className="text-sm text-gray-500">No attachments yet.</div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ticket.comments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-[var(--border)] px-3 py-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>{c.author?.name ?? "Unknown"}</div>
                      <div>{formatDateTime(c.createdAt)}</div>
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{c.body}</div>
                  </div>
                ))}
                {ticket.comments.length === 0 && <div className="text-sm text-gray-500">No comments yet.</div>}
              </div>

              <form action={addTicketComment.bind(null, ticket.id)} className="mt-4 space-y-2">
                <Textarea name="body" placeholder="Add a comment..." />
                <div className="flex justify-end">
                  <Button variant="primary" type="submit">
                    Add comment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
