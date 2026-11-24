import { data, Form, Link, redirect, useNavigation, useSearchParams } from "react-router";

import { FormError, FormField } from "~/shared/components/form-field";
import { Button } from "~/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/shared/components/ui/card";
import {
  safeRedirectPath,
  unprocessable,
  validateForm,
  type FormFailure,
} from "~/shared/lib/validate";

import { redirectIfAuthenticated } from "../auth.middleware.server";
import { loginSchema } from "../auth.schema";
import { signIn } from "../auth.server";
import type { Route } from "./+types/login";

export const meta: Route.MetaFunction = () => [{ title: "Log in" }];

export const middleware: Route.MiddlewareFunction[] = [redirectIfAuthenticated];

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = validateForm(loginSchema, formData);
  if (!result.success) return unprocessable(result);

  const auth = await signIn(result.data, request);
  if (!auth.ok) {
    // Generic message: don't reveal whether the email exists.
    return data(
      {
        fieldErrors: {},
        values: { email: result.data.email },
        formError: "Invalid email or password.",
      } satisfies FormFailure as FormFailure,
      { status: auth.status === 401 ? 401 : 400 },
    );
  }
  throw redirect(safeRedirectPath(formData.get("redirectTo"), "/posts"), {
    headers: auth.headers,
  });
}

export default function Login({ actionData }: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>
          <h1>Log in</h1>
        </CardTitle>
        <CardDescription>Welcome back.</CardDescription>
      </CardHeader>
      <Form method="post" noValidate>
        <CardContent className="grid gap-4">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") ?? "/posts"}
          />
          <FormError message={actionData?.formError} />
          <FormField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            defaultValue={actionData?.values.email}
            errors={actionData?.fieldErrors.email}
          />
          <FormField
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            errors={actionData?.fieldErrors.password}
          />
        </CardContent>
        <CardFooter className="mt-6 flex-col items-stretch gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </Button>
          <p className="text-sm text-muted-foreground">
            No account?{" "}
            <Link to="/register" className="underline underline-offset-4">
              Register
            </Link>
          </p>
        </CardFooter>
      </Form>
    </Card>
  );
}
