import { LoginClient } from "./login-client";

export default function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  const error = searchParams?.error ?? null;
  return <LoginClient error={error} />;
}
