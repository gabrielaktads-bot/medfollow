import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Bell } from "lucide-react";
import { useNotificacoes, type Notificacao } from "@/hooks/useNotificacoes";
import AlertDetailDialog from "@/components/AlertDetailDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DoctorAlerts = () => {
  const { notificacoes, isLoading, markAsRead, undoResolve } = useNotificacoes();
  const [selectedAlert, setSelectedAlert] = useState<Notificacao | null>(null);

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-7 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Alertas dos Pacientes</h2>

      {notificacoes.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center space-y-3">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="font-medium text-muted-foreground">Nenhum alerta</h3>
          <p className="text-sm text-muted-foreground/70">Alertas dos pacientes aparecerão aqui.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Conteúdo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notificacoes.map((n) => (
                <TableRow
                  key={n.id}
                  className={`cursor-pointer hover:bg-accent/50 ${n.status !== "resolvido" ? "bg-accent/30" : ""}`}
                  onClick={() => setSelectedAlert(n)}
                >
                  <TableCell className="font-medium">{n.paciente_nome}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{n.conteudo || "—"}</TableCell>
                  <TableCell><Badge variant={n.urgencia === "alta" ? "destructive" : "secondary"}>{n.tipo || "Geral"}</Badge></TableCell>
                  <TableCell>{format(new Date(n.data_de_criacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                  <TableCell><Badge variant={n.status === "resolvido" ? "secondary" : "default"}>{n.status === "resolvido" ? "Resolvido" : "Pendente"}</Badge></TableCell>
                  <TableCell className="text-right">
                    {n.status !== "resolvido" && (
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); markAsRead.mutate(n.id); }} title="Marcar como resolvido"><CheckCircle className="h-4 w-4" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDetailDialog
        open={!!selectedAlert}
        onOpenChange={(open) => { if (!open) setSelectedAlert(null); }}
        notificacao={selectedAlert}
        onMarkAsRead={(id) => markAsRead.mutate(id)}
        onUndoResolve={(id) => undoResolve.mutate(id)}
      />
    </div>
  );
};

export default DoctorAlerts;
