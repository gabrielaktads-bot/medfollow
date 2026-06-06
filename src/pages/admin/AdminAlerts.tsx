import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Bell } from "lucide-react";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminAlerts = () => {
  const { notificacoes, isLoading, markAsRead } = useNotificacoes();

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-7 w-40" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Alertas Globais</h2>

      {notificacoes.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center space-y-3">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="font-medium text-muted-foreground">Nenhum alerta no sistema</h3>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Conteúdo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notificacoes.map((n) => (
                <TableRow key={n.id} className={!n.vista ? "bg-accent/30" : ""}>
                  <TableCell className="font-medium">{n.paciente_nome}</TableCell>
                  <TableCell>{n.medico_nome}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{n.conteudo || "—"}</TableCell>
                  <TableCell>{format(new Date(n.data_de_criacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                  <TableCell><Badge variant={n.vista ? "secondary" : "default"}>{n.vista ? "Lido" : "Não lido"}</Badge></TableCell>
                  <TableCell className="text-right">
                    {!n.vista && (
                      <Button variant="ghost" size="icon" onClick={() => markAsRead.mutate(n.id)}><CheckCircle className="h-4 w-4" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminAlerts;
