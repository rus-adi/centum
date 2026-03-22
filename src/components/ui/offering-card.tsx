import { ReactNode } from "react";
import { ArrowUpRight, Bot, Compass, GraduationCap, Mail, ShieldCheck, Sparkles, Briefcase, Building2, HeartHandshake, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type IconKey = "shield" | "sparkles" | "compass" | "bot" | "mail" | "graduation" | "briefcase" | "building" | "care" | "users";

function iconFor(key: IconKey) {
  const icons: Record<IconKey, ReactNode> = {
    shield: <ShieldCheck className="h-5 w-5" />,
    sparkles: <Sparkles className="h-5 w-5" />,
    compass: <Compass className="h-5 w-5" />,
    bot: <Bot className="h-5 w-5" />,
    mail: <Mail className="h-5 w-5" />,
    graduation: <GraduationCap className="h-5 w-5" />,
    briefcase: <Briefcase className="h-5 w-5" />,
    building: <Building2 className="h-5 w-5" />,
    care: <HeartHandshake className="h-5 w-5" />,
    users: <Users className="h-5 w-5" />
  };

  return icons[key];
}

export function OfferingCard(props: {
  title: string;
  description: string;
  href: string;
  badge: string;
  iconKey: IconKey;
  audience?: string;
  note?: string;
  cta?: string;
}) {
  const { title, description, href, badge, iconKey, audience, note, cta } = props;
  const isPlaceholder = /example\.com/i.test(href) || /placeholder/i.test(note ?? "");

  return (
    <Card className={isPlaceholder ? "h-full border-amber-300 bg-amber-50/40" : "h-full"}>
      <CardContent className="flex h-full flex-col gap-4 pt-6">
        <div className="flex items-start gap-3">
          <div className={isPlaceholder ? "rounded-2xl border border-amber-200 bg-amber-100 p-2.5 text-amber-700" : "rounded-2xl border border-blue-200 bg-blue-50 p-2.5 text-blue-700"}>
            {iconFor(iconKey)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="break-words text-base font-semibold leading-6 text-gray-900">{title}</div>
              <Badge variant={isPlaceholder ? "warning" : "info"}>{badge}</Badge>
              {isPlaceholder ? <Badge variant="warning">Placeholder URL</Badge> : null}
            </div>
            <div className="mt-2 text-sm leading-6 text-gray-600">{description}</div>
          </div>
        </div>

        {audience ? <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{audience}</div> : null}
        {note ? (
          <div className={isPlaceholder ? "rounded-xl border border-amber-200 bg-amber-100/70 px-3.5 py-3 text-sm leading-6 text-amber-900" : "rounded-xl border border-[var(--border)] bg-slate-50 px-3.5 py-3 text-sm leading-6 text-gray-600"}>
            {note}
          </div>
        ) : null}

        <div className={isPlaceholder ? "mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-amber-200 pt-4" : "mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4"}>
          <div className={isPlaceholder ? "text-xs font-medium leading-5 text-amber-800" : "text-xs leading-5 text-gray-500"}>
            {isPlaceholder ? "Placeholder link — replace later" : "Live linked destination"}
          </div>
          <a
            className={isPlaceholder ? "inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100" : "inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-3.5 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50"}
            href={href}
            target="_blank"
            rel="noreferrer"
          >
            {cta ?? "Open link"}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
