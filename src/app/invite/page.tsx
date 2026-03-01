import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/app/actions/auth";

export default function InvitePage({ searchParams }: { searchParams: { [k: string]: string | string[] | undefined } }) {
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  const error = typeof searchParams.error === "string" ? searchParams.error : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept invite</CardTitle>
          <p className="mt-2 text-sm text-gray-600">Create your account to access the portal.</p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error === "invalid_or_expired" ? "This invite link is invalid or expired." : error}
            </div>
          )}

          {!token ? (
            <div className="rounded-lg border border-[var(--border)] bg-gray-50 px-3 py-2 text-sm text-gray-700">
              Missing invite token.
            </div>
          ) : (
            <form className="space-y-3" action={acceptInvite.bind(null, token)}>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Your name</label>
                <Input name="name" required placeholder="Full name" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <Input name="password" type="password" required minLength={6} placeholder="At least 6 characters" />
              </div>
              <Button variant="primary" className="w-full" type="submit">
                Create account
              </Button>
              <div className="pt-2 text-sm">
                <a className="text-blue-700 hover:underline" href="/login">
                  Back to login
                </a>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
