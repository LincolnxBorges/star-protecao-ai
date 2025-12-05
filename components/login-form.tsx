"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await signIn.email({
        email,
        password,
      });

      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Email ou senha invalidos",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Bem-vindo!</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              {error && (
                <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                  {error}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Precisa de ajuda?{" "}
        <a href="#" className="text-primary hover:underline">
          Fale com o suporte
        </a>
      </p>
    </div>
  );
}
