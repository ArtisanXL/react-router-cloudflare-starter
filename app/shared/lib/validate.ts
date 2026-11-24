import { data } from "react-router";
import { z } from "zod";

type FieldErrors = Partial<Record<string, string[]>>;

export type FormFailure = {
  fieldErrors: FieldErrors;
  /** Submitted values (minus secrets) so the form can be re-rendered. */
  values: Record<string, string>;
  formError?: string;
};

type ValidationResult<T> = { success: true; data: T } | ({ success: false } & FormFailure);

const SECRET_FIELD = /password/i;

function formValues(formData: FormData) {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

/** Parse a FormData payload with a zod schema and collect per-field errors. */
export function validateForm<S extends z.ZodType>(
  schema: S,
  formData: FormData,
): ValidationResult<z.output<S>> {
  const values = formValues(formData);
  const result = schema.safeParse(values);
  if (result.success) return { success: true, data: result.data };

  const safeValues = Object.fromEntries(
    Object.entries(values).filter(([key]) => !SECRET_FIELD.test(key)),
  );
  return {
    success: false,
    fieldErrors: z.flattenError(result.error).fieldErrors,
    values: safeValues,
  };
}

/** HTTP 422 response carrying field errors for the form to render. */
export function unprocessable(failure: FormFailure) {
  return data(
    {
      fieldErrors: failure.fieldErrors,
      values: failure.values,
      formError: failure.formError,
    } satisfies FormFailure,
    { status: 422 },
  );
}

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeRedirectPath(
  to: FormDataEntryValue | string | null | undefined,
  fallback = "/",
) {
  if (typeof to !== "string" || !to.startsWith("/") || to.startsWith("//")) {
    return fallback;
  }
  if (to.startsWith("/\\")) return fallback;
  return to;
}
