import { useState, useEffect } from "react";
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
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Detect recovery token in URL hash (fires before onAuthStateChange in some browsers)
    if (window.location.hash.includes("type=recovery")) {
      setRecoveryMode(true);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== newPasswordConfirm) {
      toast({ title: "Senhas não conferem", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "A senha deve ter ao menos 6 caracteres", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao redefinir senha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha redefinida com sucesso!" });
      setRecoveryMode(false);
      navigate("/");
    }
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
        <p className="mt-2 text-muted-foreground">{recoveryMode ? "Redefinir senha" : mode === "login" ? "Entre na sua conta" : "Redefinir senha"}</p>
      </div>

      <Card className="w-full max-w-md animate-fade-in">
        {recoveryMode ? (
          <form onSubmit={handleSetNewPassword}>
            <CardHeader>
              <CardTitle>Criar nova senha</CardTitle>
              <CardDescription>Defina sua nova senha de acesso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password-confirm">Confirmar nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password-confirm"
                    type="password"
                    placeholder="Repita a nova senha"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
              {newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm && (
                <p className="text-xs text-destructive">As senhas não conferem</p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading || newPassword.length < 6 || newPassword !== newPasswordConfirm}>
                {loading ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </CardFooter>
          </form>
        ) : mode === "login" ? (
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
