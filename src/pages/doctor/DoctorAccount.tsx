import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { maskPhone } from "@/lib/masks";
import CrmInput from "@/components/ui/CrmInput";

const ESPECIALIDADES = [
  "Cardiologia","Clínica Geral","Dermatologia","Endocrinologia",
  "Gastroenterologia","Ginecologia e Obstetrícia","Neurologia","Oftalmologia",
  "Oncologia","Ortopedia e Traumatologia","Pediatria","Psiquiatria",
  "Radiologia","Reumatologia","Urologia","Outras",
];
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DoctorAccount = () => {
  const { activeCadastro, loading } = useRole();
  const { user } = useAuth();
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [especialidades, setEspecialidades] = useState("");
  const [conselho, setConselho] = useState("");
  const [telefone, setTelefone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeCadastro) {
      setNome(activeCadastro.nome || "");
      setSobrenome(activeCadastro.sobrenome || "");
    }
  }, [activeCadastro]);

  useEffect(() => {
    if (activeCadastro?.id) {
      supabase.from("cadastros").select("especialidades, conselho, telefone").eq("id", activeCadastro.id).maybeSingle().then(({ data }) => {
        if (data) {
          setEspecialidades(data.especialidades || "");
          setConselho(data.conselho || "");
          setTelefone(data.telefone || "");
        }
      });
    }
  }, [activeCadastro?.id]);

  const handleSave = async () => {
    if (!activeCadastro?.id) return;
    setSaving(true);
    const { error } = await supabase.from("cadastros").update({ nome, sobrenome, especialidades, conselho, telefone }).eq("id", activeCadastro.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dados atualizados com sucesso" });
    }
  };

  if (loading) {
    return <div className="space-y-4 max-w-2xl"><Skeleton className="h-7 w-40" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold">Minha Conta</h2>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h3 className="font-semibold">Dados Pessoais</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" /></div>
          <div><Label>Sobrenome</Label><Input value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} className="mt-1" /></div>
          <div>
            <Label>Especialidade</Label>
            <Select value={especialidades} onValueChange={setEspecialidades}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {ESPECIALIDADES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Conselho (CRM)</Label><CrmInput value={conselho} onChange={setConselho} className="mt-1" /></div>
          <div><Label>E-mail</Label><Input value={user?.email || ""} disabled className="mt-1" /></div>
          <div><Label>Telefone</Label><Input value={telefone} onChange={(e) => setTelefone(maskPhone(e.target.value))} placeholder="(11) 99999-9999" className="mt-1" /></div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar Alterações"}</Button>
      </div>

      <Separator />

      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h3 className="font-semibold">Suporte</h3>
        <p className="text-sm text-muted-foreground">Precisa de ajuda? Entre em contato.</p>
      </div>
    </div>
  );
};

export default DoctorAccount;
