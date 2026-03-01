import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createRequest } from "@/app/actions/requests";

export default function NewRequestPage() {
  return (
    <PageShell title="New Request">
      <div className="mb-4">
        <Link href="/requests" className="text-sm font-medium text-blue-700 hover:underline">
          ← Back to Requests
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit a request</CardTitle>
          <p className="mt-2 text-sm text-gray-600">Use this for operational requests and provisioning actions.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={createRequest}>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
              <Input name="type" required placeholder="e.g., New student provisioning" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description (optional)</label>
              <Textarea name="description" placeholder="Add context, priority, deadlines..." />
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/requests">
                <Button type="button">Cancel</Button>
              </Link>
              <Button variant="primary" type="submit">
                Submit request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
