import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Pencil, Users, MessageCircle, Search, ShieldOff, ShieldCheck } from "lucide-react";
import { usePatients, type Patient, type PatientFormData } from "@/hooks/usePatients";
import PatientFormDialog from "@/components/PatientFormDialog";
import ChatHistoryDialog from "@/components/ChatHistoryDialog";

const ClinicPatients = () => {
  const navigate = useNavigate();
  const { patients, isLoading, createPatient, updatePatient, togglePatientStatus } = usePatients();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pausePatient, setPausePatient] = useState<Patient | null>(null);
  const [pauseForm, setPauseForm] = useState({
    bloquear_login: false,
    bloqueio_chat: false,
    bloqueio_agendamento: false,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(p =>
      `${p.nome} ${p.sobrenome || ""} ${p.telefone || ""}`.toLowerCase().includes(q)
    );
  }, [patients, search]);

  const openPauseDialog = (p: Patient) => {
    setPausePatient(p);
    setPauseForm({
      bloquear_login: !p.ativo,
      bloqueio_chat: p.bloqueio_chat ?? false,
      bloqueio_agendamento: p.bloqueio_agendamento ?? false,
    });
    setPauseOpen(true);
  };

  const handleSavePause = () => {
    if (!pausePatient) return;
    togglePatientStatus.mutate({
      id: pausePatient.id,
      ativo: !pauseForm.bloquear_login,
      bloqueio_chat: pauseForm.bloqueio_chat,
      bloqueio_agendamento: pauseForm.bloqueio_agendamento,
    }, { onSuccess: () => setPauseOpen(false) });
  };

  const getStatusBadge = (p: Patient) => {
    if (!p.ativo) return <Badge variant="destructive">Login bloqueado</Badge>;
    if (p.bloqueio_chat || p.bloqueio_agendamento) return <Badge variant="secondary" className="text-amber-600">Bloqueios ativos</Badge>;
    return <Badge variant="default">Ativo</Badge>;
  };

  const hasAnyBlock = (p: Patient) => !p.ativo || p.bloqueio_chat || p.bloqueio_agendamento;

  const handleSubmit = (data: PatientFormData & { id?: string }) => {
    if (data.id) {
      updatePatient.mutate(data as PatientFormData & { id: string }, { onSuccess: () => { setFormOpen(false); setEditing(null); } });
    } else {
      createPatient.mutate(data, { onSuccess: () => setFormOpen(false) });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pacientes</h2>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>+ Novo Paciente</Button>
      </div>

      {patients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {patients.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center space-y-3">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="font-medium text-muted-foreground">Nenhum paciente cadastrado</h3>
          <p className="text-sm text-muted-foreground/70">Cadastre o primeiro paciente da clínica.</p>
          <Button size="sm" onClick={() => setFormOpen(true)}>+ Novo Paciente</Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Gênero</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className={hasAnyBlock(p) ? "opacity-60" : ""}>
                  <TableCell className="font-medium cursor-pointer hover:underline" onClick={() => navigate(`/clinic/patients/${p.id}`)}>{p.nome} {p.sobrenome || ""}</TableCell>
                  <TableCell>{p.telefone || "—"}</TableCell>
                  <TableCell className="capitalize">{p.genero || "—"}</TableCell>
                  <TableCell>{getStatusBadge(p)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setHistoryPatient(p); setHistoryOpen(true); }}
                      title="Ver Histórico de Chat"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/clinic/patients/${p.id}`)} title="Ver Prontuário">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setFormOpen(true); }} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openPauseDialog(p)}
                      title="Gerenciar bloqueios"
                    >
                      {hasAnyBlock(p)
                        ? <ShieldOff className="h-4 w-4 text-amber-500" />
                        : <ShieldCheck className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && search.trim() && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum paciente encontrado para "{search}"</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Diálogo de bloqueio */}
      <Dialog open={pauseOpen} onOpenChange={setPauseOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Gerenciar Bloqueios</DialogTitle>
            <DialogDescription>
              Selecione os bloqueios para {pausePatient?.nome} {pausePatient?.sobrenome || ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="bloquear_login"
                checked={pauseForm.bloquear_login}
                onCheckedChange={(v) => setPauseForm(f => ({ ...f, bloquear_login: !!v }))}
              />
              <div className="grid gap-1">
                <label htmlFor="bloquear_login" className="text-sm font-medium cursor-pointer">Bloquear login</label>
                <p className="text-xs text-muted-foreground">Impede o paciente de acessar o sistema.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="bloqueio_chat"
                checked={pauseForm.bloqueio_chat}
                onCheckedChange={(v) => setPauseForm(f => ({ ...f, bloqueio_chat: !!v }))}
              />
              <div className="grid gap-1">
                <label htmlFor="bloqueio_chat" className="text-sm font-medium cursor-pointer">Ocultar chat</label>
                <p className="text-xs text-muted-foreground">O chat não ficará visível para o paciente.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="bloqueio_agendamento"
                checked={pauseForm.bloqueio_agendamento}
                onCheckedChange={(v) => setPauseForm(f => ({ ...f, bloqueio_agendamento: !!v }))}
              />
              <div className="grid gap-1">
                <label htmlFor="bloqueio_agendamento" className="text-sm font-medium cursor-pointer">Impedir agendamento</label>
                <p className="text-xs text-muted-foreground">Nenhum médico ou proprietário poderá agendar consultas para este paciente.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePause} disabled={togglePatientStatus.isPending}>
              {togglePatientStatus.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PatientFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }}
        patient={editing}
        onSubmit={handleSubmit}
        isLoading={createPatient.isPending || updatePatient.isPending}
      />

      <ChatHistoryDialog
        open={historyOpen}
        onOpenChange={(open) => { setHistoryOpen(open); if (!open) setHistoryPatient(null); }}
        pacienteId={historyPatient?.id || null}
        pacienteNome={historyPatient ? `${historyPatient.nome} ${historyPatient.sobrenome || ""}`.trim() : ""}
      />
    </div>
  );
};

export default ClinicPatients;
