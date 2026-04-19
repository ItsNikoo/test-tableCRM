import {Store} from "lucide-react";

interface SectionHeaderProps {
  icon: typeof Store;
  title: string;
  description: string;
}

export function SectionHeader({icon: Icon, title, description}: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-xs">
        <Icon className="size-4"/>
      </div>
      <div className="min-w-0">
        <h2 className="text-base font-semibold leading-6">{title}</h2>
        <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}