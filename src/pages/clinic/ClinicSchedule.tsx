import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Plus, Trash2, Pencil } from "lucide-react";
import { useAgendamentos, type AgendamentoFormData, type Agendamento } from "@/hooks/useAgendamentos";
import { usePatients } from "@/hooks/usePatients";
import { useDoctors } from "@/hooks/useDoctors";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ClinicSchedule = () => {
  const navigate = useNavigate();
  const { agendamentos, isLoading, createAgendamento, updateAgendamento, deleteAgendamento } = useAgendamentos();
  const { patients } = usePatients();
  const { doctors } = useDoctors();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<AgendamentoFormData>({ data_do_agendamento: "", hora: "", paciente_id: "", medico_id: "" });

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AgendamentoFormData>({ data_do_agendamento: "", hora: "", paciente_id: "", medico_id: "" });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!form.data_do_agendamento || !form.paciente_id) return;
    createAgendamento.mutate(form, {
      onSuccess: () => {
        setCreateOpen(false);
        setForm({ data_do_agendamento: "", hora: "", paciente_id: "", medico_id: "" });
      },
    });
  };

  const handleEdit = (a: Agendamento) => {
    setEditingId(a.id);
    setEditForm({
      data_do_agendamento: a.data_do_agendamento || a.data || "",
      hora: (a as any).hora || "",
      paciente_id: a.paciente_id || "",
      medico_id: a.medico_id || "",
      informacoes_adicionais: a.informacoes_adicionais || "",
    });
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingId || !editForm.data_do_agendamento || !editForm.paciente_id) return;
    updateAgendamento.mutate(
      { id: editingId, ...editForm },
      {
        onSuccess: () => {
          setEditOpen(false);
          setEditingId(null);
        },
      }
    );
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteAgendamento.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-7 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" /> Agenda da Clínica
        </h2>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-3 w-3 mr-1" /> Nova Consulta</Button>
      </div>

      {agendamentos.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center space-y-3">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="font-medium text-muted-foreground">Nenhum agendamento</h3>
          <Button size="sm" onClick={() => setCreateOpen(true)}>+ Nova Consulta</Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Informações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agendamentos.map((a) => (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => handleEdit(a)}>
                  <TableCell>
                    {a.data_do_agendamento
                      ? format(new Date(a.data_do_agendamento + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })
                      : "—"}
                  </TableCell>
                  <TableCell>{(a as any).hora || "—"}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (a.paciente_id) navigate(`/clinic/patients/${a.paciente_id}`);
                      }}
                    >
                      {a.paciente_nome}
                    </button>
                  </TableCell>
                  <TableCell>{a.medico_nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.informacoes_adicionais || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(a); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteId(a.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Consulta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data</Label><Input type="date" value={form.data_do_agendamento} onChange={(e) => setForm({ ...form, data_do_agendamento: e.target.value })} className="mt-1" /></div>
              <div><Label>Horário</Label><Input type="time" value={form.hora || ""} onChange={(e) => setForm({ ...form, hora: e.target.value })} className="mt-1" /></div>
            </div>
            <div>
              <Label>Paciente</Label>
              <Select value={form.paciente_id} onValueChange={(v) => setForm({ ...form, paciente_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome} {p.sobrenome || ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Médico (opcional)</Label>
              <Select value={form.medico_id || ""} onValueChange={(v) => setForm({ ...form, medico_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome} {d.sobrenome || ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Observações</Label><Input value={form.informacoes_adicionais || ""} onChange={(e) => setForm({ ...form, informacoes_adicionais: e.target.value })} className="mt-1" placeholder="Opcional" /></div>
            <Button onClick={handleCreate} disabled={createAgendamento.isPending} className="w-full">{createAgendamento.isPending ? "Criando..." : "Agendar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Consulta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data</Label><Input type="date" value={editForm.data_do_agendamento} onChange={(e) => setEditForm({ ...editForm, data_do_agendamento: e.target.value })} className="mt-1" /></div>
              <div><Label>Horário</Label><Input type="time" value={editForm.hora || ""} onChange={(e) => setEditForm({ ...editForm, hora: e.target.value })} className="mt-1" /></div>
            </div>
            <div>
              <Label>Paciente</Label>
              <Select value={editForm.paciente_id} onValueChange={(v) => setEditForm({ ...editForm, paciente_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome} {p.sobrenome || ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Médico (opcional)</Label>
              <Select value={editForm.medico_id || ""} onValueChange={(v) => setEditForm({ ...editForm, medico_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome} {d.sobrenome || ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Observações</Label><Input value={editForm.informacoes_adicionais || ""} onChange={(e) => setEditForm({ ...editForm, informacoes_adicionais: e.target.value })} className="mt-1" placeholder="Opcional" /></div>
            <Button onClick={handleUpdate} disabled={updateAgendamento.isPending} className="w-full">{updateAgendamento.isPending ? "Salvando..." : "Salvar Alterações"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteAgendamento.isPending}>
              {deleteAgendamento.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClinicSchedule;