import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createTicket } from "@/app/actions/tickets";
import { Select } from "@/components/ui/select";

export default function NewTicketPage() {
  return (
    <PageShell title="New Ticket">
      <div className="mb-4">
        <Link href="/support" className="text-sm font-medium text-blue-700 hover:underline">
          ← Back to Support
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a support ticket</CardTitle>
          <p className="mt-2 text-sm text-gray-600">Attach screenshots on the ticket detail page after creation.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={createTicket}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <Select name="category" defaultValue="Tool Access">
                  <option>Tool Access</option>
                  <option>Account</option>
                  <option>Policy</option>
                  <option>Billing</option>
                  <option>Other</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                <Input name="subject" required placeholder="Short summary" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <Textarea name="description" required placeholder="Describe the issue, expected behavior, urgency..." />
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/support">
                <Button type="button">Cancel</Button>
              </Link>
              <Button variant="primary" type="submit">
                Create ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
