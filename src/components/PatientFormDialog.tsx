import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Upload, CheckCircle2, UserPlus } from "lucide-react";
import { maskPhone, maskCEP } from "@/lib/masks";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { useCheckEmail } from "@/hooks/useCheckEmail";
import type { Patient, PatientFormData } from "@/hooks/usePatients";

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient | null;
  onSubmit: (data: PatientFormData & { id?: string }) => void;
  isLoading?: boolean;
}

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const PatientFormDialog = ({ open, onOpenChange, patient, onSubmit, isLoading }: PatientFormDialogProps) => {
  const { activeCadastro } = useRole();
  const clinicaId = activeCadastro?.clinica_id;
  const { checkEmail, checking: checkingEmail, emailExists, reset: resetEmailCheck } = useCheckEmail();

  const [form, setForm] = useState<PatientFormData & { password?: string }>({
    nome: "", sobrenome: "", telefone: "", genero: "", data_de_nascimento: "",
    informacoes_adicionais: "", email: "", password: "", bairro: "", cep: "", cidade: "",
    complemento: "", estado: "", foto: "", numero_da_rua: "", rua: "", medicos: [],
  });
  const [uploading, setUploading] = useState(false);

  // Fetch clinic name
  const { data: clinica } = useQuery({
    queryKey: ["clinica-nome", clinicaId],
    queryFn: async () => {
      if (!clinicaId) return null;
      const { data } = await supabase.from("clinicas").select("nome_da_clinica").eq("id", clinicaId).maybeSingle();
      return data;
    },
    enabled: !!clinicaId && open,
  });

  // Fetch doctors in clinic
  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors-clinic", clinicaId],
    queryFn: async () => {
      if (!clinicaId) return [];
      const { data } = await supabase
        .from("cadastros")
        .select("id, nome, sobrenome")
        .eq("cargo", "medico")
        .eq("clinica_id", clinicaId)
        .eq("ativo", true)
        .order("nome");
      return data || [];
    },
    enabled: !!clinicaId && open,
  });

  // Fetch patient's email from profiles if editing
  const { data: patientProfile } = useQuery({
    queryKey: ["patient-profile-email", patient?.user_id],
    queryFn: async () => {
      if (!patient?.user_id) return null;
      const { data } = await supabase.from("profiles").select("email").eq("id", patient.user_id).maybeSingle();
      return data;
    },
    enabled: !!patient?.user_id && open,
  });

  useEffect(() => {
    if (patient) {
      setForm((prev) => ({
        ...prev,
        nome: patient.nome,
        sobrenome: patient.sobrenome || "",
        telefone: patient.telefone || "",
        genero: patient.genero || "",
        data_de_nascimento: patient.data_de_nascimento || "",
        informacoes_adicionais: patient.informacoes_adicionais || "",
        email: patientProfile?.email || prev.email || "",
        bairro: patient.bairro || "",
        cep: patient.cep || "",
        cidade: patient.cidade || "",
        complemento: patient.complemento || "",
        estado: patient.estado || "",
        foto: patient.foto || "",
        numero_da_rua: patient.numero_da_rua || "",
        rua: patient.rua || "",
        medicos: patient.medicos || [],
      }));
    } else {
      setForm({
        nome: "", sobrenome: "", telefone: "", genero: "", data_de_nascimento: "",
        informacoes_adicionais: "", email: "", password: "", bairro: "", cep: "", cidade: "",
        complemento: "", estado: "", foto: "", numero_da_rua: "", rua: "", medicos: [],
      });
      resetEmailCheck();
    }
  }, [patient, open, patientProfile]);

  const set = (field: keyof PatientFormData, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("paciente-fotos").upload(path, file);
    if (error) {
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("paciente-fotos").getPublicUrl(path);
    set("foto", urlData.publicUrl);
    setUploading(false);
  };

  const toggleDoctor = (docId: string) => {
    const current = form.medicos || [];
    if (current.includes(docId)) {
      set("medicos", current.filter((id) => id !== docId));
    } else {
      set("medicos", [...current, docId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    onSubmit(patient ? { ...form, id: patient.id } : form);
  };

  const isEditing = !!patient;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{isEditing ? "Editar Paciente" : "Novo Paciente"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do paciente." : "Preencha os dados para cadastrar um novo paciente."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-y-auto">
          <form id="patient-form" onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
            {/* Identificação */}
            <h4 className="text-sm font-semibold text-muted-foreground pt-2">Identificação</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label>Sobrenome</Label>
                <Input value={form.sobrenome} onChange={(e) => set("sobrenome", e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => { if (!isEditing) { set("email", e.target.value); resetEmailCheck(); } }}
                  onBlur={() => { if (!isEditing && form.email?.trim()) checkEmail(form.email); }}
                  placeholder={isEditing ? "Sem e-mail cadastrado" : "paciente@email.com"}
                  readOnly={isEditing}
                  disabled={isEditing}
                  className={`mt-1 ${isEditing ? "bg-muted cursor-not-allowed" : ""}`}
                />
                {!isEditing && form.email?.trim() && emailExists !== null && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${emailExists ? "text-green-600" : "text-blue-600"}`}>
                    {emailExists ? (
                      <><CheckCircle2 className="h-3 w-3" /> Usuário já existe no sistema</>
                    ) : (
                      <><UserPlus className="h-3 w-3" /> Novo usuário — defina uma senha abaixo</>
                    )}
                  </p>
                )}
                {checkingEmail && <p className="text-xs mt-1 text-muted-foreground">Verificando...</p>}
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => set("telefone", maskPhone(e.target.value))} placeholder="(11) 99999-9999" className="mt-1" />
              </div>
            </div>
            {!isEditing && emailExists === false && (
              <div>
                <Label>Senha do novo usuário *</Label>
                <Input
                  type="password"
                  value={form.password || ""}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="mt-1"
                />
                {(form.password?.length ?? 0) > 0 && (form.password?.length ?? 0) < 6 && (
                  <p className="text-xs text-destructive mt-1">A senha deve ter pelo menos 6 caracteres</p>
                )}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Gênero</Label>
                <Select value={form.genero} onValueChange={(v) => set("genero", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de Nascimento</Label>
                <Input type="date" value={form.data_de_nascimento} onChange={(e) => set("data_de_nascimento", e.target.value)} className="mt-1" />
              </div>
            </div>

            {/* Foto */}
            <div>
              <Label>Foto</Label>
              <div className="mt-1 flex items-center gap-3">
                {form.foto && (
                  <div className="relative">
                    <img src={form.foto} alt="Foto" className="h-16 w-16 rounded-md object-cover border" />
                    <button type="button" onClick={() => set("foto", "")} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-accent transition-colors">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Enviando..." : "Enviar foto"}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Endereço */}
            <h4 className="text-sm font-semibold text-muted-foreground pt-2">Endereço</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>CEP</Label>
                <Input value={form.cep} onChange={(e) => set("cep", maskCEP(e.target.value))} placeholder="00000-000" className="mt-1" />
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v) => set("estado", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Bairro</Label>
                <Input value={form.bairro} onChange={(e) => set("bairro", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Rua</Label>
                <Input value={form.rua} onChange={(e) => set("rua", e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Número</Label>
                <Input value={form.numero_da_rua} onChange={(e) => set("numero_da_rua", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Complemento</Label>
                <Input value={form.complemento} onChange={(e) => set("complemento", e.target.value)} className="mt-1" />
              </div>
            </div>

            {/* Clínica e Médicos */}
            <h4 className="text-sm font-semibold text-muted-foreground pt-2">Vínculo</h4>
            <div>
              <Label>Clínica</Label>
              <Input value={clinica?.nome_da_clinica || "Sem clínica vinculada"} disabled className="mt-1 bg-muted" />
            </div>
            <div>
              <Label>Médicos</Label>
              <div className="mt-1 border rounded-md p-2 space-y-2">
                {(form.medicos || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(form.medicos || []).map((docId) => {
                      const doc = doctors.find((d) => d.id === docId);
                      return (
                        <Badge key={docId} variant="secondary" className="gap-1">
                          {doc ? `${doc.nome} ${doc.sobrenome || ""}`.trim() : docId.slice(0, 8)}
                          <button type="button" onClick={() => toggleDoctor(docId)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
                <Select onValueChange={(v) => { if (v && !(form.medicos || []).includes(v)) toggleDoctor(v); }}>
                  <SelectTrigger><SelectValue placeholder="Adicionar médico..." /></SelectTrigger>
                  <SelectContent>
                    {doctors
                      .filter((d) => !(form.medicos || []).includes(d.id))
                      .map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.nome} {d.sobrenome || ""}
                        </SelectItem>
                      ))}
                    {doctors.filter((d) => !(form.medicos || []).includes(d.id)).length === 0 && (
                      <div className="px-2 py-1 text-sm text-muted-foreground">Nenhum médico disponível</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Informações adicionais */}
            <div>
              <Label>Informações Adicionais</Label>
              <Textarea value={form.informacoes_adicionais} onChange={(e) => set("informacoes_adicionais", e.target.value)} className="mt-1" rows={3} />
            </div>
          </form>
        </ScrollArea>
        <DialogFooter className="px-6 pb-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="patient-form" disabled={isLoading || !form.nome.trim()}>
            {isLoading ? "Salvando..." : isEditing ? "Salvar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PatientFormDialog;
