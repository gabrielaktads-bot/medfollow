import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setResetSent(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center animate-fade-in">
        <img src="/favicon.png" alt="MedFollow" className="mx-auto mb-4 h-16 w-auto" />
        <h1 className="text-3xl font-bold text-foreground">MedFollow</h1>
        <p className="mt-2 text-muted-foreground">{mode === "login" ? "Entre na sua conta" : "Redefinir senha"}</p>
      </div>

      <Card className="w-full max-w-md animate-fade-in">
        {mode === "login" ? (
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Acesse sua conta com e-mail e senha</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <button
                    type="button"
                    onClick={() => { setResetEmail(email); setMode("reset"); setResetSent(false); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Carregando..." : "Entrar"}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <CardHeader>
              <CardTitle>Esqueci minha senha</CardTitle>
              <CardDescription>Informe seu e-mail para receber o link de redefinição</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resetSent ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                  <p className="text-sm font-medium">E-mail enviado!</p>
                  <p className="text-sm text-muted-foreground">
                    Verifique sua caixa de entrada em <strong>{resetEmail}</strong> e siga as instruções para redefinir sua senha.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="reset-email">E-mail cadastrado</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="pl-9"
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {!resetSent && (
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link de redefinição"}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setMode("login")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao login
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Auth;
