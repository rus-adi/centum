import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/app/actions/auth";

export default function ForgotPage({ searchParams }: { searchParams: { [k: string]: string | string[] | undefined } }) {
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  const success = typeof searchParams.success === "string" ? searchParams.success : null;
  const info = typeof searchParams.info === "string" ? searchParams.info : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <p className="mt-2 text-sm text-gray-600">Enter your email and we will send a reset link.</p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          )}
          {info && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">{info}</div>
          )}

          <form className="space-y-3" action={requestPasswordReset}>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <Input name="email" type="email" required placeholder="you@school.id" />
            </div>
            <Button variant="primary" className="w-full" type="submit">
              Send reset link
            </Button>
            <div className="pt-2 text-sm">
              <a className="text-blue-700 hover:underline" href="/login">
                Back to login
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
