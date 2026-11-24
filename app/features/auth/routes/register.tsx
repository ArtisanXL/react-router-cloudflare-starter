import { Form, Link, redirect, useNavigation } from "react-router";

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
import { unprocessable, validateForm } from "~/shared/lib/validate";

import { redirectIfAuthenticated } from "../auth.middleware.server";
import { registerSchema } from "../auth.schema";
import { signUp } from "../auth.server";
import type { Route } from "./+types/register";

export const meta: Route.MetaFunction = () => [{ title: "Register" }];

export const middleware: Route.MiddlewareFunction[] = [redirectIfAuthenticated];

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = validateForm(registerSchema, formData);
  if (!result.success) return unprocessable(result);

  const auth = await signUp(result.data, request);
  if (!auth.ok) {
    const { password: _pw, ...values } = result.data;
    return unprocessable({
      fieldErrors: {},
      values,
      formError: auth.message,
    });
  }
  throw redirect("/posts", { headers: auth.headers });
}

export default function Register({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>
          <h1>Create an account</h1>
        </CardTitle>
        <CardDescription>Email and password, nothing else.</CardDescription>
      </CardHeader>
      <Form method="post" noValidate>
        <CardContent className="grid gap-4">
          <FormError message={actionData?.formError} />
          <FormField
            name="name"
            label="Name"
            autoComplete="name"
            required
            defaultValue={actionData?.values.name}
            errors={actionData?.fieldErrors.name}
          />
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
            autoComplete="new-password"
            required
            minLength={8}
            hint="At least 8 characters."
            errors={actionData?.fieldErrors.password}
          />
        </CardContent>
        <CardFooter className="mt-6 flex-col items-stretch gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Register"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already registered?{" "}
            <Link to="/login" className="underline underline-offset-4">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Form>
    </Card>
  );
}
