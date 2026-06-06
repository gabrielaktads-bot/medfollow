import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Stethoscope, Building2, MapPin, User, ArrowRight, CheckCircle2 } from "lucide-react";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // User fields
  const [senha, setSenha] = useState("");
  const [senhaConfirm, setSenhaConfirm] = useState("");
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [userRua, setUserRua] = useState("");
  const [userNumero, setUserNumero] = useState("");
  const [userCep, setUserCep] = useState("");
  const [userBairro, setUserBairro] = useState("");
  const [userCidade, setUserCidade] = useState("");
  const [userEstado, setUserEstado] = useState("");

  // Clinic fields
  const [nomeClinica, setNomeClinica] = useState("");
  const [crm, setCrm] = useState("");
  const [clinicaRua, setClinicaRua] = useState("");
  const [clinicaNumero, setClinicaNumero] = useState("");
  const [clinicaCep, setClinicaCep] = useState("");
  const [clinicaBairro, setClinicaBairro] = useState("");
  const [clinicaCidade, setClinicaCidade] = useState("");
  const [clinicaEstado, setClinicaEstado] = useState("");

  const handleSubmit = async () => {
    if (!user) return;
    if (!nome.trim() || !nomeClinica.trim()) {
      toast({ title: "Preencha os campos obrigatórios", description: "Nome e nome da clínica são obrigatórios.", variant: "destructive" });
      return;
    }
    if (senha.length < 6) {
      toast({ title: "Senha muito curta", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (senha !== senhaConfirm) {
      toast({ title: "Senhas não conferem", description: "A confirmação de senha deve ser igual à senha.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 0. Update user password
      const { error: pwError } = await supabase.auth.updateUser({ password: senha });
      if (pwError) throw pwError;

      // 0.5 Resolve plano_id from checkout price_id
      let planoId: string | null = null;
      const checkoutPriceId = localStorage.getItem("checkout_price_id");
      if (checkoutPriceId) {
        const { data: planoData } = await supabase
          .from("planos")
          .select("id")
          .eq("stripe_price_id", checkoutPriceId)
          .eq("ativo", true)
          .maybeSingle();
        planoId = planoData?.id ?? null;
        localStorage.removeItem("checkout_price_id");
      }

      // 1. Create the clinic
      const { data: clinicaData, error: clinicaError } = await supabase
        .from("clinicas")
        .insert({
          nome_da_clinica: nomeClinica,
          conselho_responsavel: crm || null,
          nome_do_responsavel: `${nome} ${sobrenome}`.trim(),
          user_responsavel: user.id,
          plano_id: planoId,
          rua: clinicaRua || null,
          numero_da_rua: clinicaNumero || null,
          cep: clinicaCep || null,
          bairro: clinicaBairro || null,
          cidade: clinicaCidade || null,
          estado: clinicaEstado || null,
          email_da_clinica: user.email || null,
          telefone: telefone || null,
        })
        .select("id")
        .single();

      if (clinicaError) throw clinicaError;

      // 2. Create the proprietário cadastro
      const { data: cadastroData, error: cadastroError } = await supabase
        .from("cadastros")
        .insert({
          nome,
          sobrenome: sobrenome || null,
          cargo: "proprietario",
          user_id: user.id,
          clinica_id: clinicaData.id,
          telefone: telefone || null,
          rua: userRua || null,
          numero_da_rua: userNumero || null,
          cep: userCep || null,
          bairro: userBairro || null,
          cidade: userCidade || null,
          estado: userEstado || null,
          conselho: crm || null,
        })
        .select("id")
        .single();

      if (cadastroError) throw cadastroError;

      // 3. Update profile with last cadastro
      await supabase
        .from("profiles")
        .update({ ultimo_cadastro_id: cadastroData.id, nome })
        .eq("id", user.id);

      toast({ title: "Bem-vindo ao MedFollow! 🎉", description: "Sua conta foi configurada com sucesso." });
      navigate("/clinic/dashboard", { state: { showWelcome: true } });
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast({ title: "Erro ao configurar conta", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = nome.trim().length > 0 && senha.length >= 6 && senha === senhaConfirm;
  const canSubmit = nome.trim().length > 0 && nomeClinica.trim().length > 0 && senha.length >= 6;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Stethoscope className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">MedFollow</h1>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Bem-vindo ao MedFollow! 👋</h2>
          <p className="text-muted-foreground">
            Vamos configurar sua conta em poucos passos para que você possa começar a usar a plataforma.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
            </div>
            <span className="text-sm font-medium">Seus dados</span>
          </div>
          <div className="w-12 h-px bg-border" />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              2
            </div>
            <span className="text-sm font-medium">Clínica</span>
          </div>
        </div>

        {/* Step 1: User data */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Dados pessoais
              </CardTitle>
              <CardDescription>Informe seus dados como responsável pela clínica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sobrenome">Sobrenome</Label>
                  <Input id="sobrenome" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} placeholder="Seu sobrenome" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>

              <Separator />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Defina sua senha de acesso</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
                  <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senhaConfirm">Confirmar senha *</Label>
                  <Input id="senhaConfirm" type="password" value={senhaConfirm} onChange={(e) => setSenhaConfirm(e.target.value)} placeholder="Repita a senha" />
                </div>
              </div>
              {senha.length > 0 && senha.length < 6 && (
                <p className="text-xs text-destructive">A senha deve ter pelo menos 6 caracteres</p>
              )}
              {senhaConfirm.length > 0 && senha !== senhaConfirm && (
                <p className="text-xs text-destructive">As senhas não conferem</p>
              )}

              <Separator />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Endereço pessoal</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="userRua">Rua</Label>
                  <Input id="userRua" value={userRua} onChange={(e) => setUserRua(e.target.value)} placeholder="Nome da rua" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userNumero">Número</Label>
                  <Input id="userNumero" value={userNumero} onChange={(e) => setUserNumero(e.target.value)} placeholder="Nº" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userCep">CEP</Label>
                  <Input id="userCep" value={userCep} onChange={(e) => setUserCep(e.target.value)} placeholder="00000-000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userBairro">Bairro</Label>
                  <Input id="userBairro" value={userBairro} onChange={(e) => setUserBairro(e.target.value)} placeholder="Bairro" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userCidade">Cidade</Label>
                  <Input id="userCidade" value={userCidade} onChange={(e) => setUserCidade(e.target.value)} placeholder="Cidade" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userEstado">Estado</Label>
                  <Input id="userEstado" value={userEstado} onChange={(e) => setUserEstado(e.target.value)} placeholder="UF" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Clinic data */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Dados da clínica
              </CardTitle>
              <CardDescription>Informe os dados da sua clínica ou consultório</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeClinica">Nome da clínica *</Label>
                  <Input id="nomeClinica" value={nomeClinica} onChange={(e) => setNomeClinica(e.target.value)} placeholder="Nome da clínica" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crm">CRM do responsável</Label>
                  <Input id="crm" value={crm} onChange={(e) => setCrm(e.target.value)} placeholder="CRM/UF 000000" />
                </div>
              </div>

              <Separator />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Endereço da clínica</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="clinicaRua">Rua</Label>
                  <Input id="clinicaRua" value={clinicaRua} onChange={(e) => setClinicaRua(e.target.value)} placeholder="Nome da rua" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicaNumero">Número</Label>
                  <Input id="clinicaNumero" value={clinicaNumero} onChange={(e) => setClinicaNumero(e.target.value)} placeholder="Nº" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicaCep">CEP</Label>
                  <Input id="clinicaCep" value={clinicaCep} onChange={(e) => setClinicaCep(e.target.value)} placeholder="00000-000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicaBairro">Bairro</Label>
                  <Input id="clinicaBairro" value={clinicaBairro} onChange={(e) => setClinicaBairro(e.target.value)} placeholder="Bairro" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicaCidade">Cidade</Label>
                  <Input id="clinicaCidade" value={clinicaCidade} onChange={(e) => setClinicaCidade(e.target.value)} placeholder="Cidade" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicaEstado">Estado</Label>
                  <Input id="clinicaEstado" value={clinicaEstado} onChange={(e) => setClinicaEstado(e.target.value)} placeholder="UF" />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                <Button onClick={handleSubmit} disabled={!canSubmit || loading}>
                  {loading ? "Configurando..." : "Finalizar cadastro"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
