import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, Pencil, Pause, Play, CheckCircle2, UserPlus, Search } from "lucide-react";
import { maskPhone } from "@/lib/masks";
import CrmInput from "@/components/ui/CrmInput";

const ESPECIALIDADES = [
  "Cardiologia","Clínica Geral","Dermatologia","Endocrinologia",
  "Gastroenterologia","Ginecologia e Obstetrícia","Neurologia","Oftalmologia",
  "Oncologia","Ortopedia e Traumatologia","Pediatria","Psiquiatria",
  "Radiologia","Reumatologia","Urologia","Outras",
];
import { useCheckEmail } from "@/hooks/useCheckEmail";
import { useDoctors, type Doctor } from "@/hooks/useDoctors";
import { usePatients } from "@/hooks/usePatients";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface DoctorFormData {
  nome: string;
  sobrenome: string;
  especialidades: string;
  conselho: string;
  telefone: string;
  email: string;
  password: string;
}

const ClinicDoctors = () => {
  const { doctors, isLoading } = useDoctors();
  const { patients } = usePatients();
  const { activeCadastro, refetchCadastros } = useRole();
  const clinicaId = activeCadastro?.clinica_id;
  const queryClient = useQueryClient();
  const { checkEmail, checking: checkingEmail, emailExists, reset: resetEmailCheck } = useCheckEmail();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDoctor, setConfirmDoctor] = useState<Doctor | null>(null);
  const [form, setForm] = useState<DoctorFormData>({
    nome: "", sobrenome: "", especialidades: "", conselho: "", telefone: "", email: "", password: "",
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return doctors;
    const q = search.toLowerCase();
    return doctors.filter(d =>
      `${d.nome} ${d.sobrenome || ""} ${d.especialidades || ""} ${d.conselho || ""} ${d.telefone || ""}`.toLowerCase().includes(q)
    );
  }, [doctors, search]);

  const openNew = () => {
    setEditing(null);
    setForm({ nome: "", sobrenome: "", especialidades: "", conselho: "", telefone: "", email: "", password: "" });
    resetEmailCheck();
    setFormOpen(true);
  };

  const openEdit = (doc: Doctor) => {
    setEditing(doc);
    setForm({
      nome: doc.nome,
      sobrenome: doc.sobrenome || "",
      especialidades: doc.especialidades || "",
      conselho: doc.conselho || "",
      telefone: doc.telefone || "",
      email: "",
      password: "",
    });
    setFormOpen(true);
  };

  // Resolve clinicaId: from cadastro or fallback to clinicas table
  const resolvedClinicaId = clinicaId || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;

    // Resolve clinic ID dynamically if not available from cadastro
    let finalClinicaId = resolvedClinicaId;
    if (!finalClinicaId) {
      const { data: clinicaData } = await supabase
        .from("clinicas")
        .select("id")
        .eq("user_responsavel", (await supabase.auth.getUser()).data.user?.id || "")
        .maybeSingle();
      finalClinicaId = clinicaData?.id || null;
    }

    if (!finalClinicaId) {
      toast({ title: "Erro", description: "Nenhuma clínica vinculada encontrada.", variant: "destructive" });
      return;
    }

    // Validate password for new users
    if (!editing && emailExists === false && form.email?.trim()) {
      if (!form.password || form.password.length < 6) {
        toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("cadastros")
          .update({
            nome: form.nome,
            sobrenome: form.sobrenome || null,
            especialidades: form.especialidades || null,
            conselho: form.conselho || null,
            telefone: form.telefone || null,
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Médico atualizado com sucesso" });
      } else {
        // Find or create user if email provided
        let userId: string | null = null;
        if (form.email?.trim()) {
          const { data: fnData, error: fnError } = await supabase.functions.invoke("find-or-create-user", {
            body: { email: form.email.trim(), password: form.password || undefined },
          });
          if (fnError) throw new Error("Erro ao buscar/criar usuário: " + fnError.message);
          if (fnData?.error) throw new Error(fnData.error);
          userId = fnData?.user_id || null;

          // Block duplicate: same user already has a medico cadastro in this clinic
          if (userId) {
            const { data: existing } = await supabase
              .from("cadastros")
              .select("id")
              .eq("user_id", userId)
              .eq("clinica_id", finalClinicaId)
              .eq("cargo", "medico")
              .maybeSingle();
            if (existing) {
              toast({ title: "Médico já cadastrado", description: "Este e-mail já possui um cadastro de médico nesta clínica.", variant: "destructive" });
              setSaving(false);
              return;
            }
          }
        }

        const { data, error } = await supabase
          .from("cadastros")
          .insert({
            nome: form.nome,
            sobrenome: form.sobrenome || null,
            especialidades: form.especialidades || null,
            conselho: form.conselho || null,
            telefone: form.telefone || null,
            cargo: "medico",
            clinica_id: finalClinicaId,
            user_id: userId as unknown as string,
            ativo: true,
          })
          .select("id")
          .single();
        if (error) throw error;

        // Add doctor to clinic's medicos array
        if (data?.id) {
          const { data: clinicaData } = await supabase
            .from("clinicas")
            .select("medicos")
            .eq("id", finalClinicaId)
            .maybeSingle();
          const currentMedicos = (clinicaData?.medicos as string[]) || [];
          await supabase
            .from("clinicas")
            .update({ medicos: [...currentMedicos, data.id] })
            .eq("id", finalClinicaId);
        }

        toast({ title: "Médico cadastrado com sucesso", description: `${form.nome} ${form.sobrenome || ""}`.trim() + " foi adicionado à equipe." });
      }
      await queryClient.invalidateQueries({ queryKey: ["doctors"] });
      await refetchCadastros();
      setFormOpen(false);
    } catch (error: any) {
      toast({ title: "Erro ao salvar médico", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (doc: Doctor) => {
    const { error } = await supabase
      .from("cadastros")
      .update({ ativo: !doc.ativo })
      .eq("id", doc.id);
    if (error) {
      toast({ title: "Erro ao alterar status", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      toast({ title: doc.ativo ? "Médico desativado" : "Médico reativado" });
    }
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-7 w-32" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Médicos</h2>
        <Button size="sm" onClick={openNew}>+ Novo Médico</Button>
      </div>

      {doctors.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar médico por nome, especialidade ou CRM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {doctors.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center space-y-3">
          <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="font-medium text-muted-foreground">Nenhum médico cadastrado nesta clínica</h3>
          <p className="text-sm text-muted-foreground/70">Cadastre o primeiro médico da clínica.</p>
          <Button size="sm" onClick={openNew}>+ Novo Médico</Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>CRM / Conselho</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Pacientes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id} className={!d.ativo ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{d.nome} {d.sobrenome || ""}</TableCell>
                  <TableCell>{d.especialidades || "—"}</TableCell>
                  <TableCell className="text-sm">{d.conselho || "—"}</TableCell>
                  <TableCell>{d.telefone || "—"}</TableCell>
                  <TableCell>{patients.filter(p => p.medicos?.includes(d.id)).length}</TableCell>
                  <TableCell><Badge variant={d.ativo ? "default" : "secondary"}>{d.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setConfirmDoctor(d); setConfirmOpen(true); }} title={d.ativo ? "Desativar" : "Reativar"}>
                      {d.ativo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && search.trim() && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum médico encontrado para "{search}"</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{confirmDoctor?.ativo ? "Desativar médico" : "Reativar médico"}</DialogTitle>
            <DialogDescription>
              {confirmDoctor?.ativo
                ? `Deseja desativar ${confirmDoctor?.nome} ${confirmDoctor?.sobrenome || ""}? O médico perderá o acesso ao sistema.`
                : `Deseja reativar ${confirmDoctor?.nome} ${confirmDoctor?.sobrenome || ""}? O médico voltará a ter acesso ao sistema.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button
              variant={confirmDoctor?.ativo ? "destructive" : "default"}
              onClick={() => { if (confirmDoctor) { toggleStatus(confirmDoctor); setConfirmOpen(false); } }}
            >
              {confirmDoctor?.ativo ? "Desativar" : "Reativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Médico" : "Novo Médico"}</DialogTitle>
            <DialogDescription>
              {editing ? "Atualize os dados do médico." : "Preencha os dados para cadastrar um novo médico."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))} required className="mt-1" />
              </div>
              <div>
                <Label>Sobrenome</Label>
                <Input value={form.sobrenome} onChange={(e) => setForm(f => ({ ...f, sobrenome: e.target.value }))} className="mt-1" />
              </div>
            </div>
            {!editing && (
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => { setForm(f => ({ ...f, email: e.target.value })); resetEmailCheck(); }}
                  onBlur={() => { if (form.email?.trim()) checkEmail(form.email); }}
                  placeholder="medico@email.com"
                  className="mt-1"
                />
                {form.email?.trim() && emailExists !== null && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${emailExists ? "text-green-600" : "text-blue-600"}`}>
                    {emailExists ? (
                      <><CheckCircle2 className="h-3 w-3" /> Usuário já existe no sistema</>
                    ) : (
                      <><UserPlus className="h-3 w-3" /> Novo usuário — defina uma senha abaixo</>
                    )}
                  </p>
                )}
                {checkingEmail && <p className="text-xs mt-1 text-muted-foreground">Verificando...</p>}
                <p className="text-xs text-muted-foreground mt-1">Será usado para criar o acesso do médico ao sistema.</p>
              </div>
            )}
            {!editing && emailExists === false && (
              <div>
                <Label>Senha do novo usuário *</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="mt-1"
                />
                {form.password.length > 0 && form.password.length < 6 && (
                  <p className="text-xs text-destructive mt-1">A senha deve ter pelo menos 6 caracteres</p>
                )}
              </div>
            )}
            <div>
              <Label>CRM / Conselho *</Label>
              <CrmInput value={form.conselho} onChange={(v) => setForm(f => ({ ...f, conselho: v }))} className="mt-1" />
            </div>
            <div>
              <Label>Especialidade</Label>
              <Select value={form.especialidades} onValueChange={(v) => setForm(f => ({ ...f, especialidades: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {ESPECIALIDADES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm(f => ({ ...f, telefone: maskPhone(e.target.value) }))} placeholder="(11) 99999-9999" className="mt-1" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving || !form.nome.trim()}>
                {saving ? "Salvando..." : editing ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicDoctors;