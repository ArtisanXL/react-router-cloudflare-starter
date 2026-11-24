import * as React from "react";

import { Input } from "~/shared/components/ui/input";
import { Label } from "~/shared/components/ui/label";
import { Textarea } from "~/shared/components/ui/textarea";

type BaseProps = {
  name: string;
  label: string;
  errors?: string[];
  hint?: string;
};

type FormFieldProps =
  | (BaseProps & { as?: "input" } & Omit<React.ComponentProps<"input">, "name">)
  | (BaseProps & { as: "textarea" } & Omit<React.ComponentProps<"textarea">, "name">);

/** Label + control + accessible error list (aria-invalid / aria-describedby). */
export function FormField(props: FormFieldProps) {
  const { name, label, errors, hint } = props;
  const id = React.useId();
  const controlId = `${id}-${name}`;
  const errorId = `${controlId}-error`;
  const hintId = `${controlId}-hint`;
  const invalid = Boolean(errors?.length);
  const describedBy =
    [hint ? hintId : null, invalid ? errorId : null].filter(Boolean).join(" ") || undefined;

  const a11y = {
    id: controlId,
    name,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
  };

  let control: React.ReactNode;
  if (props.as === "textarea") {
    const { as: _as, label: _l, errors: _e, hint: _h, name: _n, ...rest } = props;
    control = <Textarea {...rest} {...a11y} />;
  } else {
    const { as: _as, label: _l, errors: _e, hint: _h, name: _n, ...rest } = props;
    control = <Input {...rest} {...a11y} />;
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={controlId}>{label}</Label>
      {control}
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {invalid ? (
        <ul id={errorId} className="text-sm text-destructive">
          {errors!.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}
