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
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-0">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
        </div>
        {badge ? <Badge variant={badge.variant}>{badge.label}</Badge> : null}
      </CardHeader>
      <CardContent className="pt-3">
        <div className="break-words text-3xl font-semibold tracking-tight text-gray-900 sm:text-[2rem]">{value}</div>
        {note ? <div className="mt-2 text-sm leading-6 text-gray-600">{note}</div> : null}
      </CardContent>
    </Card>
  );
}
