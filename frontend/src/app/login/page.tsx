"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login } from "@/features/auth/api/auth.api";
import { setTokens } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      const result = await login({ loginId, password });
      setTokens(result.accessToken, result.refreshToken);
      router.push("/dashboard");
    } catch {
      setError("로그인에 실패했습니다.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 p-5">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>ERP System</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2 text-sm font-medium">
              아이디
              <Input value={loginId} onChange={(event) => setLoginId(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              비밀번호
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full" type="submit">
              로그인
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
