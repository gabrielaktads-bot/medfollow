import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { usePlanos } from "@/hooks/usePlanos";
import { useQuery } from "@tanstack/react-query";
import type { Clinica, ClinicaFormData, HorarioAtendimento } from "@/hooks/useClinics";
import { Upload, X, ChevronsUpDown, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClinicFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClinicaFormData) => void;
  isSubmitting?: boolean;
  initialData?: Clinica | null;
}

const DEFAULT_HORARIOS: HorarioAtendimento[] = [
  { dia: "Segunda", inicio: "08:00", fim: "18:00", ativo: true },
  { dia: "Terça", inicio: "08:00", fim: "18:00", ativo: true },
  { dia: "Quarta", inicio: "08:00", fim: "18:00", ativo: true },
  { dia: "Quinta", inicio: "08:00", fim: "18:00", ativo: true },
  { dia: "Sexta", inicio: "08:00", fim: "18:00", ativo: true },
  { dia: "Sábado", inicio: "08:00", fim: "12:00", ativo: false },
  { dia: "Domingo", inicio: "", fim: "", ativo: false },
];

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const ClinicFormDialog = ({ open, onOpenChange, onSubmit, isSubmitting, initialData }: ClinicFormDialogProps) => {
  const { planos } = usePlanos();
  const [form, setForm] = useState<ClinicaFormData>({ nome_da_clinica: "", ativa: true });
  const [uploading, setUploading] = useState(false);
  const [responsavelOpen, setResponsavelOpen] = useState(false);

  const { data: usuarios = [] } = useQuery({
    queryKey: ["usuarios-para-responsavel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cadastros")
        .select("id, nome, sobrenome, user_id")
        .not("user_id", "is", null)
        .order("nome");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Also fetch profiles for email info
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-para-responsavel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, nome");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const usuariosComEmail = usuarios.map((u) => {
    const profile = profiles.find((p) => p.id === u.user_id);
    return {
      ...u,
      email: profile?.email || "",
      nomeCompleto: [u.nome, u.sobrenome].filter(Boolean).join(" "),
    };
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        nome_da_clinica: initialData.nome_da_clinica,
        email_da_clinica: initialData.email_da_clinica || "",
        telefone: initialData.telefone || "",
        cnpj: initialData.cnpj || "",
        ativa: initialData.ativa,
        cidade: initialData.cidade || "",
        estado: initialData.estado || "",
        bairro: initialData.bairro || "",
        cep: initialData.cep || "",
        complemento: initialData.complemento || "",
        conselho_responsavel: initialData.conselho_responsavel || "",
        foto: initialData.foto || "",
        funcionarios: initialData.funcionarios || [],
        informacoes_adicionais: initialData.informacoes_adicionais || "",
        medicos: initialData.medicos || [],
        nome_do_responsavel: initialData.nome_do_responsavel || "",
        notificacoes: initialData.notificacoes || [],
        numero_da_rua: initialData.numero_da_rua || "",
        pacientes: initialData.pacientes || [],
        plano_id: initialData.plano_id || "",
        rua: initialData.rua || "",
        user_responsavel: initialData.user_responsavel || "",
        horarios_atendimento: initialData.horarios_atendimento || DEFAULT_HORARIOS,
      });
    } else {
      setForm({ nome_da_clinica: "", ativa: true, horarios_atendimento: DEFAULT_HORARIOS });
    }
  }, [initialData, open]);

  const set = (key: keyof ClinicaFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("clinica-fotos").upload(path, file);
    if (error) {
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("clinica-fotos").getPublicUrl(path);
    set("foto", urlData.publicUrl);
    setUploading(false);
  };

  const handleSelectResponsavel = (usuario: typeof usuariosComEmail[0]) => {
    set("nome_do_responsavel", usuario.nomeCompleto);
    set("user_responsavel", usuario.user_id || "");
    setResponsavelOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome_da_clinica.trim()) return;
    onSubmit(form);
  };

  const isEdit = !!initialData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{isEdit ? "Editar Clínica" : "Nova Clínica"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh]">
          <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6">
            {/* Basic Info */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_da_clinica">Nome da clínica *</Label>
                  <Input id="nome_da_clinica" value={form.nome_da_clinica} onChange={(e) => set("nome_da_clinica", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" value={form.cnpj || ""} onChange={(e) => set("cnpj", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_da_clinica">E-mail da clínica</Label>
                  <Input id="email_da_clinica" type="email" value={form.email_da_clinica || ""} onChange={(e) => set("email_da_clinica", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" value={form.telefone || ""} onChange={(e) => set("telefone", e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="ativa" checked={form.ativa ?? true} onCheckedChange={(v) => set("ativa", v)} />
                <Label htmlFor="ativa">Clínica ativa</Label>
              </div>
            </section>

            <Separator />

            {/* Responsável */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Responsável</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome do responsável</Label>
                  <Popover open={responsavelOpen} onOpenChange={setResponsavelOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={responsavelOpen}
                        className="w-full justify-between font-normal"
                      >
                        {form.nome_do_responsavel || "Selecione um responsável..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar por nome ou e-mail..." />
                        <CommandList>
                          <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                          <CommandGroup>
                            {usuariosComEmail.map((u) => (
                              <CommandItem
                                key={u.id}
                                value={`${u.nomeCompleto} ${u.email}`}
                                onSelect={() => handleSelectResponsavel(u)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.user_responsavel === u.user_id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{u.nomeCompleto}</span>
                                  {u.email && <span className="text-xs text-muted-foreground">{u.email}</span>}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conselho_responsavel">Conselho responsável</Label>
                  <Input id="conselho_responsavel" value={form.conselho_responsavel || ""} onChange={(e) => set("conselho_responsavel", e.target.value)} />
                </div>
              </div>
            </section>

            <Separator />

            {/* Endereço */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" value={form.cep || ""} onChange={(e) => set("cep", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rua">Rua</Label>
                  <Input id="rua" value={form.rua || ""} onChange={(e) => set("rua", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_da_rua">Número</Label>
                  <Input id="numero_da_rua" value={form.numero_da_rua || ""} onChange={(e) => set("numero_da_rua", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input id="complemento" value={form.complemento || ""} onChange={(e) => set("complemento", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" value={form.bairro || ""} onChange={(e) => set("bairro", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" value={form.cidade || ""} onChange={(e) => set("cidade", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={form.estado || ""} onValueChange={(v) => set("estado", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator />

            {/* Foto */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Foto</h3>
              <div className="flex items-center gap-4">
                {form.foto && (
                  <div className="relative">
                    <img src={form.foto} alt="Foto da clínica" className="h-20 w-20 rounded-lg object-cover border" />
                    <button type="button" onClick={() => set("foto", "")} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-accent transition-colors">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Enviando..." : "Enviar foto"}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
                </label>
              </div>
            </section>

            <Separator />

            {/* Plano */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Plano</h3>
              <div className="space-y-2">
                <Label htmlFor="plano_id">Plano</Label>
                <Select value={form.plano_id || ""} onValueChange={(v) => set("plano_id", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {planos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome_do_plano} — {p.limite_agendamentos_mensal ?? 0} agend./mês, {p.numero_de_usuarios ?? 0} usuários
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <Separator />

            {/* Horários de Atendimento */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Clock className="h-4 w-4" /> Horários de Atendimento
              </h3>
              <div className="space-y-3">
                {(form.horarios_atendimento || DEFAULT_HORARIOS).map((h, idx) => (
                  <div key={h.dia} className="flex items-center gap-3">
                    <Switch
                      checked={h.ativo}
                      onCheckedChange={(v) => {
                        const updated = [...(form.horarios_atendimento || DEFAULT_HORARIOS)];
                        updated[idx] = { ...updated[idx], ativo: v };
                        set("horarios_atendimento", updated);
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
                            const updated = [...(form.horarios_atendimento || DEFAULT_HORARIOS)];
                            updated[idx] = { ...updated[idx], inicio: e.target.value };
                            set("horarios_atendimento", updated);
                          }}
                          className="w-28"
                        />
                        <span className="text-muted-foreground text-sm">às</span>
                        <Input
                          type="time"
                          value={h.fim}
                          onChange={(e) => {
                            const updated = [...(form.horarios_atendimento || DEFAULT_HORARIOS)];
                            updated[idx] = { ...updated[idx], fim: e.target.value };
                            set("horarios_atendimento", updated);
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
            </section>

            <Separator />

            {/* Info adicional */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informações Adicionais</h3>
              <Textarea id="informacoes_adicionais" value={form.informacoes_adicionais || ""} onChange={(e) => set("informacoes_adicionais", e.target.value)} rows={3} placeholder="Observações, notas..." />
            </section>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting || !form.nome_da_clinica.trim()}>
                {isSubmitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar clínica"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ClinicFormDialog;
