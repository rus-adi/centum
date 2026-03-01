import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createStudent } from "@/app/actions/students";

export default function NewStudentPage({ searchParams }: { searchParams: { [k: string]: string | undefined } }) {
  const error = searchParams.error;

  return (
    <PageShell title="Add Student">
      <div className="mb-4">
        <Link href="/students" className="text-sm font-medium text-blue-700 hover:underline">
          ← Back to Students
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Student details</CardTitle>
          <p className="mt-2 text-sm text-gray-600">Create a student record for provisioning and tool access.</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" action={createStudent}>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Student code (optional)</label>
              <Input name="studentCode" placeholder="e.g., JKT-0006" />
              <p className="mt-1 text-xs text-gray-500">Recommended for clean CSV imports and duplicate detection.</p>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
              <Input name="name" required placeholder="Student name" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Grade</label>
              <Input name="grade" type="number" min={1} max={12} required defaultValue={8} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <Select name="status" defaultValue="ACTIVE">
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
                <option value="DISABLED">DISABLED</option>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Coach name (optional)</label>
              <Input name="coachName" placeholder="Coach / advisor" />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Link href="/students">
                <Button type="button">Cancel</Button>
              </Link>
              <Button variant="primary" type="submit">
                Create student
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
