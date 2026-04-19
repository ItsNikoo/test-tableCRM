import {Field, FieldLabel} from "@/components/ui/field";
import {ChevronDown} from "lucide-react";

interface SelectStubProps {
  label: string
  value?: string
}

export function SelectStub({label, value = "Выберите"}: SelectStubProps) {
  return (
    <Field className="gap-2">
      <FieldLabel className="text-xs text-muted-foreground">{label}</FieldLabel>
      <button
        className="flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 text-left text-sm shadow-xs transition-colors hover:bg-accent">
        <span className="truncate text-muted-foreground">{value}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground"/>
      </button>
    </Field>
  );
}