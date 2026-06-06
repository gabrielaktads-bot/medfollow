import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Pencil, Pause, Play, Users, Search } from "lucide-react";
import { usePatients, type Patient, type PatientFormData } from "@/hooks/usePatients";
import PatientFormDialog from "@/components/PatientFormDialog";

const DoctorPatients = () => {
  const navigate = useNavigate();
  const { patients, isLoading, createPatient, updatePatient, togglePatientStatus } = usePatients();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [viewing, setViewing] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(p =>
      `${p.nome} ${p.sobrenome || ""} ${p.telefone || ""}`.toLowerCase().includes(q)
    );
  }, [patients, search]);

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
        <h2 className="text-lg font-semibold">Meus Pacientes</h2>
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
          <p className="text-sm text-muted-foreground/70">Cadastre seu primeiro paciente para começar o acompanhamento.</p>
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
                <TableRow key={p.id} className={!p.ativo ? "opacity-60" : ""}>
                  <TableCell className="font-medium cursor-pointer hover:underline" onClick={() => navigate(`/doctor/patients/${p.id}`)}>{p.nome} {p.sobrenome || ""}</TableCell>
                  <TableCell>{p.telefone || "—"}</TableCell>
                  <TableCell className="capitalize">{p.genero || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.ativo ? "default" : "secondary"}>
                      {p.ativo ? "Ativo" : "Pausado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/doctor/patients/${p.id}`)} title="Ver Prontuário">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setFormOpen(true); }} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePatientStatus.mutate({ id: p.id, ativo: !p.ativo })}
                      title={p.ativo ? "Pausar" : "Reativar"}
                    >
                      {p.ativo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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

      <PatientFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }}
        patient={editing}
        onSubmit={handleSubmit}
        isLoading={createPatient.isPending || updatePatient.isPending}
      />

      {viewing && (
        <PatientFormDialog
          open={!!viewing}
          onOpenChange={(open) => { if (!open) setViewing(null); }}
          patient={viewing}
          onSubmit={(data) => {
            updatePatient.mutate(data as PatientFormData & { id: string }, { onSuccess: () => setViewing(null) });
          }}
          isLoading={updatePatient.isPending}
        />
      )}
    </div>
  );
};

export default DoctorPatients;