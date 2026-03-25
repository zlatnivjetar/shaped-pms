"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { InlineError } from "@/components/ui/inline-error";
import { SubmitButton } from "@/components/ui/submit-button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await signIn.email({ email, password });
      if (signInError) {
        setError(signInError.message ?? "Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
        return;
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed");
    }

    setLoading(false);
  }

  return (
    <Card className="w-full max-w-md gap-0 overflow-hidden py-0">
      <CardHeader className="border-b border-border text-center">
        <div className="mb-2 flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
        </div>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Enter your credentials to access the Shaped dashboard.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          {error && <InlineError>{error}</InlineError>}

          <FormField label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              required
              autoFocus
            />
          </FormField>

          <FormField label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </FormField>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-border py-6">
          <SubmitButton isPending={loading} pendingLabel="Signing in…" className="w-full">
            Sign in
          </SubmitButton>
          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              Create one
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
