"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { signUp } from "@/lib/auth-client";
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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signUpError } = await signUp.email({ name, email, password });
      if (signUpError) {
        setError(signUpError.message ?? "Registration failed");
      } else {
        router.push("/dashboard");
        router.refresh();
        return;
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed");
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
        <CardTitle>Create account</CardTitle>
        <CardDescription>Set up your Shaped PMS account.</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          {error && <InlineError>{error}</InlineError>}

          <FormField label="Name" htmlFor="name">
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              required
              autoFocus
            />
          </FormField>

          <FormField label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              required
            />
          </FormField>

          <FormField label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </FormField>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-border py-6">
          <SubmitButton
            isPending={loading}
            pendingLabel="Creating account…"
            className="w-full"
          >
            Create account
          </SubmitButton>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:text-primary-hover hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
