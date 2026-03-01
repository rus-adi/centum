import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
type Role = "SUPER_ADMIN" | "ADMIN" | "IT" | "STAFF" | "COACH" | "TEACHER";

const ROLES: { role: Role; label: string }[] = [
  { role: "SUPER_ADMIN", label: "Super Admin" },
  { role: "ADMIN", label: "Admin" },
  { role: "IT", label: "IT" },
  { role: "STAFF", label: "Staff" },
  { role: "COACH", label: "Coach" },
  { role: "TEACHER", label: "Teacher" }
];

type PermItem = { label: string; allowed: Role[] };

const SECTIONS: { title: string; items: PermItem[] }[] = [
  {
    title: "Core",
    items: [
      { label: "View dashboard + school data", allowed: ["SUPER_ADMIN", "ADMIN", "IT", "STAFF", "COACH", "TEACHER"] },
      { label: "View notifications", allowed: ["SUPER_ADMIN", "ADMIN", "IT", "STAFF", "COACH", "TEACHER"] }
    ]
  },
  {
    title: "Students",
    items: [
      { label: "View students", allowed: ["SUPER_ADMIN", "ADMIN", "IT", "STAFF", "COACH", "TEACHER"] },
      { label: "Create + edit students", allowed: ["SUPER_ADMIN", "ADMIN", "IT", "STAFF", "COACH", "TEACHER"] },
      { label: "Import students via CSV", allowed: ["SUPER_ADMIN", "ADMIN", "IT", "STAFF"] },
      { label: "Delete students", allowed: ["SUPER_ADMIN", "ADMIN"] }
    ]
  },
  {
    title: "Tools",
    items: [
      { label: "View tool catalog + school tool status", allowed: ["SUPER_ADMIN", "ADMIN", "IT", "STAFF", "COACH", "TEACHER"] },
      { label: "Request tool enable/disable changes", allowed: ["SUPER_ADMIN", "ADMIN", "IT", "STAFF", "COACH", "TEACHER"] },
      { label: "Directly enable/disable school tools", allowed: ["SUPER_ADMIN", "ADMIN", "IT"] },
      { label: "Request student tool access changes", allowed: ["SUPER_ADMIN", "ADMIN", "IT", "STAFF", "COACH", "TEACHER"] },
      { label: "Directly change student tool access", allowed: ["SUPER_ADMIN", "ADMIN", "IT"] }
    ]
  },
  {
    title: "Requests",
    items: [
      { label: "Submit requests", allowed: ["SUPER_ADMIN", "ADMIN", "IT", "STAFF", "COACH", "TEACHER"] },
      { label: "Comment on requests + view timeline", allowed: ["SUPER_ADMIN", "ADMIN", "IT", "STAFF", "COACH", "TEACHER"] },
      { label: "Assign requests + change status", allowed: ["SUPER_ADMIN", "ADMIN", "IT"] },
      { label: "Approve / deny tool-related requests", allowed: ["SUPER_ADMIN", "ADMIN", "IT"] },
      { label: "Delete requests", allowed: ["SUPER_ADMIN", "ADMIN"] }
    ]
  },
  {
    title: "Support",
    items: [
      { label: "Submit support tickets", allowed: ["SUPER_ADMIN", "ADMIN", "IT", "STAFF", "COACH", "TEACHER"] },
      { label: "Comment on tickets + view timeline", allowed: ["SUPER_ADMIN", "ADMIN", "IT", "STAFF", "COACH", "TEACHER"] },
      { label: "Assign tickets + change status", allowed: ["SUPER_ADMIN", "ADMIN", "IT"] },
      { label: "Delete tickets", allowed: ["SUPER_ADMIN", "ADMIN"] }
    ]
  },
  {
    title: "Training + Updates",
    items: [
      { label: "Complete training modules", allowed: ["SUPER_ADMIN", "ADMIN", "IT", "STAFF", "COACH", "TEACHER"] },
      { label: "Reset own training progress", allowed: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Publish updates (optionally force retraining)", allowed: ["SUPER_ADMIN", "ADMIN"] }
    ]
  },
  {
    title: "Settings + Admin",
    items: [
      { label: "View settings", allowed: ["SUPER_ADMIN", "ADMIN", "IT", "STAFF", "COACH", "TEACHER"] },
      { label: "Update school profile", allowed: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Invite users", allowed: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Change roles / activate / delete users", allowed: ["SUPER_ADMIN", "ADMIN"] },
      { label: "View audit log", allowed: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Create schools + switch active school", allowed: ["SUPER_ADMIN"] }
    ]
  }
];

function AllowedIcon() {
  return <Check size={16} className="mx-auto text-emerald-600" />;
}

export function RolePermissionsCard() {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Role permissions</CardTitle>
        <p className="mt-2 text-sm text-gray-600">
          Lightweight reference for what each role can do in this portal (based on enforced server-side permissions).
        </p>
      </CardHeader>
      <CardContent>
        {/* Desktop matrix */}
        <div className="hidden md:block">
          <div className="overflow-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Permission</th>
                  {ROLES.map((r) => (
                    <th key={r.role} className="px-3 py-3 text-center font-medium">
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map((section) => (
                  <React.Fragment key={section.title}>
                    <tr key={section.title}>
                      <td
                        className="border-t border-[var(--border)] bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600"
                        colSpan={ROLES.length + 1}
                      >
                        {section.title}
                      </td>
                    </tr>
                    {section.items.map((item) => (
                      <tr key={section.title + item.label}>
                        <td className="border-t border-[var(--border)] px-4 py-3 text-gray-800">{item.label}</td>
                        {ROLES.map((r) => (
                          <td key={r.role} className="border-t border-[var(--border)] px-3 py-3 text-center">
                            {item.allowed.includes(r.role) ? <AllowedIcon /> : <span className="text-gray-300">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile: per-role cards */}
        <div className="grid gap-4 md:hidden">
          {ROLES.map((r) => {
            const sections = SECTIONS.map((s) => ({
              title: s.title,
              items: s.items.filter((i) => i.allowed.includes(r.role))
            })).filter((s) => s.items.length > 0);

            return (
              <div key={r.role} className="rounded-lg border border-[var(--border)] bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">{r.label}</div>
                <div className="mt-3 space-y-3">
                  {sections.map((s) => (
                    <div key={s.title}>
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{s.title}</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                        {s.items.map((i) => (
                          <li key={i.label}>{i.label}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-[var(--border)] bg-gray-50 px-4 py-3 text-sm text-gray-700">
          If you want to change what a role can do, update the server-side checks in{" "}
          <span className="font-mono">src/lib/rbac.ts</span> and the relevant action handlers.
        </div>
      </CardContent>
    </Card>
  );
}
