import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function QuoteCard({
  title,
  quote,
  href,
  meta
}: {
  title: string;
  quote: string;
  href?: string;
  meta?: React.ReactNode;
}) {
  return (
    <Card className="border-blue-100 bg-blue-50/40">
      <CardContent className="space-y-3">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <blockquote className="border-l-2 border-blue-300 pl-3 text-sm leading-6 text-gray-700">“{quote}”</blockquote>
        <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
          <div>{meta}</div>
          {href ? (
            <Link className="font-medium text-blue-700 hover:underline" href={href}>
              Open source
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
