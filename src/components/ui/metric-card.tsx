import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MetricCard({
  title,
  value,
  note,
  badge
}: {
  title: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  badge?: { label: string; variant?: "success" | "warning" | "danger" | "info" | "neutral" };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
        </div>
        {badge ? <Badge variant={badge.variant}>{badge.label}</Badge> : null}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold text-gray-900">{value}</div>
        {note ? <div className="mt-2 text-sm text-gray-600">{note}</div> : null}
      </CardContent>
    </Card>
  );
}
