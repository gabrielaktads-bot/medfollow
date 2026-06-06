import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { useClinics, type Clinica } from "@/hooks/useClinics";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ClinicFormDialog from "@/components/ClinicFormDialog";

const AdminClinics = () => {
  const { clinicas, isLoading, createClinica, updateClinica, toggleAtiva, deleteClinica } = useClinics();
  const [formOpen, setFormOpen] = useState(false);
  const [editingClinica, setEditingClinica] = useState<Clinica | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingClinica(null);
    setFormOpen(true);
  };

  const handleEdit = (clinica: Clinica) => {
    setEditingClinica(clinica);
    setFormOpen(true);
  };

  const handleSubmit = (data: Parameters<typeof createClinica.mutate>[0]) => {
    if (editingClinica) {
      updateClinica.mutate({ ...data, id: editingClinica.id }, { onSuccess: () => setFormOpen(false) });
    } else {
      createClinica.mutate(data, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteClinica.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
    }
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-7 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Clínicas Cadastradas</h2>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nova Clínica
        </Button>
      </div>

      {clinicas.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center space-y-3">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="font-medium text-muted-foreground">Nenhuma clínica cadastrada</h3>
          <Button variant="outline" size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" /> Criar primeira clínica
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinicas.map((c) => (
                <TableRow key={c.id} className={!c.ativa ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{c.nome_da_clinica}</TableCell>
                  <TableCell>{c.email_da_clinica || "—"}</TableCell>
                  <TableCell>{c.cidade ? `${c.cidade}/${c.estado}` : "—"}</TableCell>
                  <TableCell className="text-xs">{c.cnpj || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={c.ativa}
                        onCheckedChange={(v) => toggleAtiva.mutate({ id: c.id, ativa: v })}
                        aria-label="Ativar/desativar clínica"
                      />
                      <Badge variant={c.ativa ? "default" : "secondary"} className="text-xs">
                        {c.ativa ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{format(new Date(c.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingId(c.id)} title="Excluir" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ClinicFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        isSubmitting={createClinica.isPending || updateClinica.isPending}
        initialData={editingClinica}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir clínica?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é irreversível. Todos os dados associados a esta clínica poderão ser perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteClinica.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminClinics;
