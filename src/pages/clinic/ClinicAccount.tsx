import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { CreditCard, ExternalLink, Check, Lock, Upload, Building2, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { maskPhone, maskCNPJ, maskCEP } from "@/lib/masks";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { HorarioAtendimento } from "@/hooks/useClinics";
import { useSearchParams } from "react-router-dom";
import { formatBRL } from "@/lib/utils";

const ClinicAccount = () => {
  const { activeCadastro, activeRole, loading } = useRole();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const sub = useSubscription();

  // Personal data
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [genero, setGenero] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [rua, setRua] = useState("");
  const [numeroRua, setNumeroRua] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [foto, setFoto] = useState("");
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Clinic data (only for proprietário)
  const [clinica, setClinica] = useState<any>(null);
  const [loadingClinica, setLoadingClinica] = useState(true);
  const [savingClinica, setSavingClinica] = useState(false);

  const isProprietario = activeRole === "proprietario";

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast({ title: "Assinatura realizada com sucesso!" });
      sub.refresh();
    } else if (checkout === "cancel") {
      toast({ title: "Checkout cancelado", variant: "destructive" });
    }
  }, [searchParams]);

  // Load personal data from cadastro
  useEffect(() => {
    if (!activeCadastro?.id) return;
    supabase.from("cadastros")
      .select("nome, sobrenome, telefone, genero, data_de_nascimento, rua, numero_da_rua, complemento, bairro, cidade, estado, cep, foto")
      .eq("id", activeCadastro.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setNome(data.nome || "");
          setSobrenome(data.sobrenome || "");
          setTelefone(data.telefone || "");
          setGenero(data.genero || "");
          setDataNascimento(data.data_de_nascimento || "");
          setRua(data.rua || "");
          setNumeroRua(data.numero_da_rua || "");
          setComplemento(data.complemento || "");
          setBairro(data.bairro || "");
          setCidade(data.cidade || "");
          setEstado(data.estado || "");
          setCep(data.cep || "");
          setFoto(data.foto || "");
        }
      });
  }, [activeCadastro?.id]);

  // Load clinic data for proprietário
  useEffect(() => {
    if (!isProprietario || !activeCadastro?.clinica_id) {
      setLoadingClinica(false);
      return;
    }
    supabase.from("clinicas").select("*").eq("id", activeCadastro.clinica_id).maybeSingle().then(({ data }) => {
      setClinica(data);
      setLoadingClinica(false);
    });
  }, [activeCadastro?.clinica_id, isProprietario]);

  const handleSavePersonal = async () => {
    if (!activeCadastro?.id) return;
    setSavingPersonal(true);
    const { error } = await supabase.from("cadastros").update({
      nome, sobrenome, telefone, genero,
      data_de_nascimento: dataNascimento || null,
      rua, numero_da_rua: numeroRua, complemento, bairro, cidade, estado, cep, foto,
    }).eq("id", activeCadastro.id);
    setSavingPersonal(false);
    if (error) toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    else toast({ title: "Dados pessoais atualizados com sucesso" });
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Senha alterada com sucesso" });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSaveClinica = async () => {
    if (!clinica?.id) return;
    setSavingClinica(true);
    const { error } = await supabase.from("clinicas").update({
      nome_da_clinica: clinica.nome_da_clinica,
      email_da_clinica: clinica.email_da_clinica,
      telefone: clinica.telefone,
      cnpj: clinica.cnpj,
      rua: clinica.rua,
      numero_da_rua: clinica.numero_da_rua,
      complemento: clinica.complemento,
      bairro: clinica.bairro,
      cidade: clinica.cidade,
      estado: clinica.estado,
      cep: clinica.cep,
      foto: clinica.foto,
      nome_do_responsavel: clinica.nome_do_responsavel,
      conselho_responsavel: clinica.conselho_responsavel,
      informacoes_adicionais: clinica.informacoes_adicionais,
      horarios_atendimento: clinica.horarios_atendimento,
    }).eq("id", clinica.id);
    setSavingClinica(false);
    if (error) toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    else toast({ title: "Dados da clínica atualizados com sucesso" });
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>, type: "personal" | "clinic") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const bucket = type === "clinic" ? "clinica-fotos" : "paciente-fotos";
    const id = type === "clinic" ? clinica?.id : activeCadastro?.id;
    if (!id) return;
    const filePath = `${id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(filePath, file);
    if (error) {
      toast({ title: "Erro ao enviar foto", description: error.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    if (type === "personal") {
      setFoto(urlData.publicUrl);
    } else {
      setClinica({ ...clinica, foto: urlData.publicUrl });
    }
    toast({ title: "Foto enviada com sucesso" });
  };

  if (loading || (isProprietario && loadingClinica)) {
    return <div className="space-y-4 max-w-2xl"><Skeleton className="h-7 w-40" /><Skeleton className="h-64 w-full" /></div>;
  }

  // Use DB plan (clinica.plano_id) as primary source
  const dbPlanoId = clinica?.plano_id;
  const currentPlan = sub.planos.find((p) => p.id === dbPlanoId) ?? sub.currentPlano;
  const currentPrice = currentPlan?.valor_mensal ?? 0;

  // Only show plans MORE expensive than current
  const upgradePlans = sub.planos.filter(
    (p) => p.ativo && p.stripe_price_id && p.id !== currentPlan?.id && (p.valor_mensal ?? 0) > currentPrice
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold">Minha Conta</h2>

      {/* Personal photo */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h3 className="font-semibold">Foto de Perfil</h3>
        <div className="flex items-center gap-4">
          {foto ? (
            <img src={foto} alt="Foto" className="h-16 w-16 rounded-full object-cover border" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xl font-bold">
              {nome?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <Upload className="h-3.5 w-3.5" /> Alterar foto
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadFoto(e, "personal")} />
            </label>
          </div>
        </div>
      </div>

      {/* Personal data */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h3 className="font-semibold">Dados Pessoais</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" /></div>
          <div><Label>Sobrenome</Label><Input value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} className="mt-1" /></div>
          <div>
            <Label className="flex items-center gap-1">E-mail <Lock className="h-3 w-3 text-muted-foreground" /></Label>
            <Input value={user?.email || ""} disabled className="mt-1" />
          </div>
          <div><Label>Telefone</Label><Input value={telefone} onChange={(e) => setTelefone(maskPhone(e.target.value))} placeholder="(11) 99999-9999" className="mt-1" /></div>
          <div>
            <Label>Gênero</Label>
            <Select value={genero} onValueChange={setGenero}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Data de Nascimento</Label><Input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} className="mt-1" /></div>
        </div>

        <Separator />
        <h4 className="font-medium text-sm text-muted-foreground">Endereço</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>CEP</Label><Input value={cep} onChange={(e) => setCep(maskCEP(e.target.value))} placeholder="00000-000" className="mt-1" /></div>
          <div><Label>Rua</Label><Input value={rua} onChange={(e) => setRua(e.target.value)} className="mt-1" /></div>
          <div><Label>Número</Label><Input value={numeroRua} onChange={(e) => setNumeroRua(e.target.value)} className="mt-1" /></div>
          <div><Label>Complemento</Label><Input value={complemento} onChange={(e) => setComplemento(e.target.value)} className="mt-1" /></div>
          <div><Label>Bairro</Label><Input value={bairro} onChange={(e) => setBairro(e.target.value)} className="mt-1" /></div>
          <div><Label>Cidade</Label><Input value={cidade} onChange={(e) => setCidade(e.target.value)} className="mt-1" /></div>
          <div><Label>Estado</Label><Input value={estado} onChange={(e) => setEstado(e.target.value)} className="mt-1" /></div>
        </div>

        <Button size="sm" onClick={handleSavePersonal} disabled={savingPersonal}>{savingPersonal ? "Salvando..." : "Salvar Dados Pessoais"}</Button>
      </div>

      {/* Change password */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h3 className="font-semibold">Alterar Senha</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Nova Senha</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" placeholder="Mínimo 6 caracteres" /></div>
          <div><Label>Confirmar Senha</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" /></div>
        </div>
        <Button size="sm" onClick={handleChangePassword} disabled={savingPassword}>{savingPassword ? "Alterando..." : "Alterar Senha"}</Button>
      </div>

      {/* Clinic data — only for proprietário */}
      {isProprietario && clinica && (
        <>
          <Separator />
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Dados da Clínica</h3>

            {/* Clinic photo */}
            <div className="flex items-center gap-4">
              {clinica.foto ? (
                <img src={clinica.foto} alt="Clínica" className="h-16 w-16 rounded-lg object-cover border" />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <label className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <Upload className="h-3.5 w-3.5" /> Alterar foto da clínica
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadFoto(e, "clinic")} />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Nome da Clínica</Label><Input value={clinica.nome_da_clinica || ""} onChange={(e) => setClinica({ ...clinica, nome_da_clinica: e.target.value })} className="mt-1" /></div>
              <div><Label>E-mail da Clínica</Label><Input value={clinica.email_da_clinica || ""} onChange={(e) => setClinica({ ...clinica, email_da_clinica: e.target.value })} className="mt-1" /></div>
              <div><Label>Telefone</Label><Input value={clinica.telefone || ""} onChange={(e) => setClinica({ ...clinica, telefone: maskPhone(e.target.value) })} placeholder="(11) 99999-9999" className="mt-1" /></div>
              <div><Label>CNPJ</Label><Input value={clinica.cnpj || ""} onChange={(e) => setClinica({ ...clinica, cnpj: maskCNPJ(e.target.value) })} placeholder="00.000.000/0000-00" className="mt-1" /></div>
              <div><Label>Responsável</Label><Input value={clinica.nome_do_responsavel || ""} onChange={(e) => setClinica({ ...clinica, nome_do_responsavel: e.target.value })} className="mt-1" /></div>
              <div><Label>Conselho do Responsável</Label><Input value={clinica.conselho_responsavel || ""} onChange={(e) => setClinica({ ...clinica, conselho_responsavel: e.target.value })} className="mt-1" /></div>
            </div>

            <Separator />
            <h4 className="font-medium text-sm text-muted-foreground">Endereço da Clínica</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>CEP</Label><Input value={clinica.cep || ""} onChange={(e) => setClinica({ ...clinica, cep: maskCEP(e.target.value) })} placeholder="00000-000" className="mt-1" /></div>
              <div><Label>Rua</Label><Input value={clinica.rua || ""} onChange={(e) => setClinica({ ...clinica, rua: e.target.value })} className="mt-1" /></div>
              <div><Label>Número</Label><Input value={clinica.numero_da_rua || ""} onChange={(e) => setClinica({ ...clinica, numero_da_rua: e.target.value })} className="mt-1" /></div>
              <div><Label>Complemento</Label><Input value={clinica.complemento || ""} onChange={(e) => setClinica({ ...clinica, complemento: e.target.value })} className="mt-1" /></div>
              <div><Label>Bairro</Label><Input value={clinica.bairro || ""} onChange={(e) => setClinica({ ...clinica, bairro: e.target.value })} className="mt-1" /></div>
              <div><Label>Cidade</Label><Input value={clinica.cidade || ""} onChange={(e) => setClinica({ ...clinica, cidade: e.target.value })} className="mt-1" /></div>
              <div><Label>Estado</Label><Input value={clinica.estado || ""} onChange={(e) => setClinica({ ...clinica, estado: e.target.value })} className="mt-1" /></div>
            </div>

            <div><Label>Informações Adicionais</Label><Input value={clinica.informacoes_adicionais || ""} onChange={(e) => setClinica({ ...clinica, informacoes_adicionais: e.target.value })} className="mt-1" /></div>

            <Separator />
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Horários de Atendimento
            </h4>
            <div className="space-y-3">
              {(clinica.horarios_atendimento as HorarioAtendimento[] || []).map((h: HorarioAtendimento, idx: number) => (
                <div key={h.dia} className="flex items-center gap-3">
                  <Switch
                    checked={h.ativo}
                    onCheckedChange={(v) => {
                      const updated = [...(clinica.horarios_atendimento as HorarioAtendimento[])];
                      updated[idx] = { ...updated[idx], ativo: v };
                      setClinica({ ...clinica, horarios_atendimento: updated });
                    }}
                  />
                  <span className={cn("w-20 text-sm font-medium", !h.ativo && "text-muted-foreground")}>
                    {h.dia}
                  </span>
                  {h.ativo ? (
                    <>
                      <Input
                        type="time"
                        value={h.inicio}
                        onChange={(e) => {
                          const updated = [...(clinica.horarios_atendimento as HorarioAtendimento[])];
                          updated[idx] = { ...updated[idx], inicio: e.target.value };
                          setClinica({ ...clinica, horarios_atendimento: updated });
                        }}
                        className="w-28"
                      />
                      <span className="text-muted-foreground text-sm">às</span>
                      <Input
                        type="time"
                        value={h.fim}
                        onChange={(e) => {
                          const updated = [...(clinica.horarios_atendimento as HorarioAtendimento[])];
                          updated[idx] = { ...updated[idx], fim: e.target.value };
                          setClinica({ ...clinica, horarios_atendimento: updated });
                        }}
                        className="w-28"
                      />
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Fechado</span>
                  )}
                </div>
              ))}
            </div>

            <Button size="sm" onClick={handleSaveClinica} disabled={savingClinica}>{savingClinica ? "Salvando..." : "Salvar Dados da Clínica"}</Button>
          </div>
        </>
      )}

      {/* Subscription */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" /> Assinatura
        </h3>

        {sub.loading ? (
          <Skeleton className="h-20 w-full" />
        ) : currentPlan ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="default">Ativa</Badge>
              <span className="text-sm text-muted-foreground">
                {currentPlan.nome_do_plano}
              </span>
            </div>
            <p className="text-sm font-medium">
              {formatBRL(currentPlan.valor_mensal)}<span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
            {sub.subscriptionEnd && (
              <p className="text-sm text-muted-foreground">
                Próxima renovação: {new Date(sub.subscriptionEnd).toLocaleDateString("pt-BR")}
              </p>
            )}
            <Button variant="outline" size="sm" onClick={sub.openPortal}>
              <ExternalLink className="h-3 w-3 mr-1" /> Gerenciar Assinatura
            </Button>

            {upgradePlans.length > 0 && (
              <div className="space-y-3 pt-2">
                <Separator />
                <p className="text-sm font-medium">Opções de upgrade:</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {upgradePlans.map((plan) => (
                    <div key={plan.id} className="rounded-lg border p-4 space-y-2">
                      <h4 className="font-medium">{plan.nome_do_plano}</h4>
                      <p className="text-2xl font-bold">
                        {formatBRL(plan.valor_mensal)}
                        <span className="text-sm font-normal text-muted-foreground">/mês</span>
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>{plan.limite_agendamentos_mensal ?? 0} agendamentos/mês</p>
                        <p>{plan.numero_de_usuarios ?? 0} usuários</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={sub.openPortal}>
                  <ExternalLink className="h-3 w-3 mr-1" /> Alterar plano no portal
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma assinatura ativa encontrada.</p>
        )}
      </div>

      {/* Support */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h3 className="font-semibold">Suporte</h3>
        <p className="text-sm text-muted-foreground">Precisa de ajuda? Entre em contato.</p>
      </div>
    </div>
  );
};

export default ClinicAccount;
