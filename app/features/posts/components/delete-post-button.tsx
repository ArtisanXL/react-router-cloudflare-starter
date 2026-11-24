import { Form, useNavigation } from "react-router";

import { Button } from "~/shared/components/ui/button";

/**
 * Two-step delete. <details>/<summary> gives a confirm step that works without
 * JS and is keyboard / screen-reader accessible. The form posts to the delete
 * resource route, which redirects back to the list.
 */
export function DeletePostButton({ postId, title }: { postId: string; title: string }) {
  const action = `/posts/${postId}/delete`;
  const navigation = useNavigation();
  const deleting = navigation.state !== "idle" && navigation.formAction === action;
  const labelId = `delete-${postId}-label`;

  return (
    <details className="w-full">
      <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-md border px-4 text-sm font-medium text-destructive outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        Delete…
      </summary>
      <div className="mt-3 grid gap-3 rounded-md border p-4">
        <p id={labelId} className="text-sm">
          Delete “{title}”? This cannot be undone.
        </p>
        <Form method="post" action={action} aria-labelledby={labelId}>
          <Button type="submit" variant="destructive" size="sm" disabled={deleting}>
            {deleting ? "Deleting…" : "Yes, delete post"}
          </Button>
        </Form>
      </div>
    </details>
  );
}
