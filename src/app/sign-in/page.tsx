"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan. Coba lagi.";
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setIsBusy(true);
    try {
      await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsBusy(true);
    try {
      if (mode === "sign-up") {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Masuk ke Reindex AI</CardTitle>
          <CardDescription>
            Lanjutkan menulis draf skripsi, tesis, atau paper Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isBusy}
          >
            Lanjutkan dengan Google
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">atau</span>
            <Separator className="flex-1" />
          </div>

          <form className="space-y-3" onSubmit={handleEmailSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isBusy}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Kata sandi</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isBusy}
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isBusy}>
              {mode === "sign-up" ? "Buat akun" : "Masuk"}
            </Button>
          </form>

          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() =>
              setMode((m) => (m === "sign-in" ? "sign-up" : "sign-in"))
            }
            disabled={isBusy}
          >
            {mode === "sign-in"
              ? "Belum punya akun? Daftar"
              : "Sudah punya akun? Masuk"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
