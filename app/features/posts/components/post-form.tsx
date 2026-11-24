import { Form, Link, useNavigation } from "react-router";

import { FormError, FormField } from "~/shared/components/form-field";
import { Button } from "~/shared/components/ui/button";
import type { FormFailure } from "~/shared/lib/validate";

import { BODY_MAX, TITLE_MAX, TITLE_MIN } from "../posts.constants";

type PostFormProps = {
  defaultValues?: { title?: string; body?: string };
  failure?: FormFailure;
  submitLabel: string;
  cancelTo: string;
};

export function PostForm({ defaultValues, failure, submitLabel, cancelTo }: PostFormProps) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const values = failure?.values ?? defaultValues ?? {};

  return (
    // noValidate: server-side zod validation is the source of truth (422 + errors).
    <Form method="post" noValidate className="grid gap-4">
      <FormError message={failure?.formError} />
      <FormField
        name="title"
        label="Title"
        required
        minLength={TITLE_MIN}
        maxLength={TITLE_MAX}
        hint={`${TITLE_MIN}–${TITLE_MAX} characters.`}
        defaultValue={values.title}
        errors={failure?.fieldErrors.title}
      />
      <FormField
        as="textarea"
        name="body"
        label="Body"
        required
        rows={8}
        maxLength={BODY_MAX}
        defaultValue={values.body}
        errors={failure?.fieldErrors.body}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
        <Button asChild variant="ghost">
          <Link to={cancelTo}>Cancel</Link>
        </Button>
      </div>
    </Form>
  );
}
