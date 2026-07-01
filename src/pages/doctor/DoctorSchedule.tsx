import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Plus, Trash2, Ban } from "lucide-react";
import { useAgendamentos, type AgendamentoFormData } from "@/hooks/useAgendamentos";
import { usePatients } from "@/hooks/usePatients";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DoctorSchedule = () => {
  const { agendamentos, isLoading, createAgendamento, deleteAgendamento } = useAgendamentos();
  const { patients } = usePatients();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AgendamentoFormData>({ data_do_agendamento: "", hora: "", paciente_id: "" });

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({ data: "", hora_inicio: "", hora_fim: "", motivo: "" });

  const isBlock = (a: { paciente_id: string | null }) => !a.paciente_id;

  const handleCreate = () => {
    if (!form.data_do_agendamento || !form.paciente_id || !form.hora) return;
    createAgendamento.mutate(form, {
      onSuccess: () => { setOpen(false); setForm({ data_do_agendamento: "", hora: "", paciente_id: "" }); },
    });
  };

  const handleCreateBlock = () => {
    if (!blockForm.data || !blockForm.hora_inicio) return;
    const obs = [
      "[BLOQUEIO]",
      blockForm.motivo || "Horário bloqueado",
      blockForm.hora_fim ? `(até ${blockForm.hora_fim})` : "",
    ].filter(Boolean).join(" ");
    createAgendamento.mutate(
      { data_do_agendamento: blockForm.data, hora: blockForm.hora_inicio, paciente_id: null, informacoes_adicionais: obs },
      { onSuccess: () => { setBlockOpen(false); setBlockForm({ data: "", hora_inicio: "", hora_fim: "", motivo: "" }); } }
    );
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-7 w-40" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" /> Minha Agenda
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setBlockOpen(true)}>
            <Ban className="h-3 w-3 mr-1" /> Bloquear Horário
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-3 w-3 mr-1" /> Nova Consulta
          </Button>
        </div>
      </div>

      {agendamentos.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center space-y-3">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="font-medium text-muted-foreground">Nenhum agendamento</h3>
          <p className="text-sm text-muted-foreground/70">Agende sua primeira consulta ou bloqueie um horário.</p>
          <Button size="sm" onClick={() => setOpen(true)}>+ Nova Consulta</Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Informações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agendamentos.map((a) => (
                <TableRow key={a.id} className={isBlock(a) ? "bg-muted/40" : ""}>
                  <TableCell>
                    {a.data_do_agendamento
                      ? format(new Date(a.data_do_agendamento + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })
                      : "—"}
                  </TableCell>
                  <TableCell>{(a as any).hora || "—"}</TableCell>
                  <TableCell className="font-medium">
                    {isBlock(a)
                      ? <Badge variant="secondary" className="text-amber-600 border-amber-300">Bloqueado</Badge>
                      : a.paciente_nome}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {isBlock(a)
                      ? (a.informacoes_adicionais?.replace("[BLOQUEIO]", "").trim() || "Horário bloqueado")
                      : (a.informacoes_adicionais || "—")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteAgendamento.mutate(a.id)} title="Remover">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Nova Consulta */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Consulta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data *</Label>
                <Input type="date" value={form.data_do_agendamento} onChange={(e) => setForm({ ...form, data_do_agendamento: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Horário *</Label>
                <Input type="time" value={form.hora || ""} onChange={(e) => setForm({ ...form, hora: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Paciente *</Label>
              <Select value={form.paciente_id || ""} onValueChange={(v) => setForm({ ...form, paciente_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                <SelectContent>
                  {patients.filter(p => !p.bloqueio_agendamento).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome} {p.sobrenome || ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Input value={form.informacoes_adicionais || ""} onChange={(e) => setForm({ ...form, informacoes_adicionais: e.target.value })} className="mt-1" placeholder="Opcional" />
            </div>
            <Button onClick={handleCreate} disabled={createAgendamento.isPending} className="w-full">
              {createAgendamento.isPending ? "Criando..." : "Agendar Consulta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bloquear Horário */}
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Ban className="h-4 w-4 text-amber-500" /> Bloquear Horário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data *</Label>
              <Input type="date" value={blockForm.data} onChange={(e) => setBlockForm({ ...blockForm, data: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início *</Label>
                <Input type="time" value={blockForm.hora_inicio} onChange={(e) => setBlockForm({ ...blockForm, hora_inicio: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Fim</Label>
                <Input type="time" value={blockForm.hora_fim} onChange={(e) => setBlockForm({ ...blockForm, hora_fim: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Motivo</Label>
              <Input value={blockForm.motivo} onChange={(e) => setBlockForm({ ...blockForm, motivo: e.target.value })} className="mt-1" placeholder="Ex: Reunião, Almoço, Indisponível..." />
            </div>
            <Button onClick={handleCreateBlock} disabled={createAgendamento.isPending} className="w-full">
              {createAgendamento.isPending ? "Salvando..." : "Bloquear Horário"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorSchedule;
