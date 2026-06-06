import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, MessageCircle, Bot, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import type { Notificacao } from "@/hooks/useNotificacoes";

interface AlertDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notificacao: Notificacao | null;
  onMarkAsRead: (id: string) => void;
  onUndoResolve?: (id: string) => void;
}

const AlertDetailDialog = ({ open, onOpenChange, notificacao, onMarkAsRead, onUndoResolve }: AlertDetailDialogProps) => {
  const [showChat, setShowChat] = useState(false);

  const { data: messages, isLoading: chatLoading } = useQuery({
    queryKey: ["alert_chat_history", notificacao?.paciente_id],
    queryFn: async () => {
      if (!notificacao?.paciente_id) return [];
      const { data, error } = await supabase
        .from("mensagens_chat")
        .select("id, role, conteudo, created_at")
        .eq("paciente_id", notificacao.paciente_id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!notificacao?.paciente_id && open && showChat,
  });

  const handleClose = (val: boolean) => {
    if (!val) setShowChat(false);
    onOpenChange(val);
  };

  const handleMarkResolved = () => {
    if (!notificacao) return;
    const alertId = notificacao.id;

    // Fire subtle confetti
    confetti({
      particleCount: 60,
      spread: 55,
      origin: { y: 0.7 },
      colors: ["#22c55e", "#16a34a", "#4ade80", "#86efac"],
      gravity: 1.2,
      scalar: 0.8,
      ticks: 120,
    });

    // Close dialog
    handleClose(false);

    // Mark as resolved
    onMarkAsRead(alertId);

    // Show toast with undo
    toast({
      title: "✅ Alerta marcado como resolvido",
      description: "O alerta foi resolvido com sucesso.",
      action: onUndoResolve ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUndoResolve(alertId)}
        >
          Desfazer
        </Button>
      ) : undefined,
    });
  };

  if (!notificacao) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhe do Alerta
            <Badge variant={notificacao.urgencia === "alta" ? "destructive" : "secondary"}>
              {notificacao.tipo || "Geral"}
            </Badge>
            <Badge variant={notificacao.status === "resolvido" ? "secondary" : "default"}>
              {notificacao.status === "resolvido" ? "Resolvido" : "Pendente"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Alert info */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Paciente:</span> <span className="font-medium">{notificacao.paciente_nome}</span></div>
              <div><span className="text-muted-foreground">Médico:</span> <span className="font-medium">{notificacao.medico_nome}</span></div>
              <div><span className="text-muted-foreground">Data:</span> {format(new Date(notificacao.data_de_criacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
              <div><span className="text-muted-foreground">Prioridade:</span> <Badge variant={notificacao.prioridade === "alta" ? "destructive" : "secondary"}>{notificacao.prioridade || "Normal"}</Badge></div>
            </div>
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-sm font-medium text-muted-foreground mb-1">Conteúdo do Alerta</p>
              <p className="text-sm whitespace-pre-wrap">{notificacao.conteudo || "Sem conteúdo"}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {notificacao.status !== "resolvido" && (
              <Button size="sm" variant="outline" onClick={handleMarkResolved}>
                <CheckCircle className="h-4 w-4 mr-1" /> Marcar como resolvido
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowChat(!showChat)}>
              <MessageCircle className="h-4 w-4 mr-1" /> {showChat ? "Ocultar conversa" : "Ver conversa completa"}
            </Button>
          </div>

          {/* Chat history */}
          {showChat && (
            <ScrollArea className="flex-1 min-h-0 border rounded-lg p-3">
              {chatLoading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-3/4" />)}
                </div>
              ) : !messages || messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma mensagem encontrada para este paciente.
                </p>
              ) : (
                <div className="space-y-3 py-2">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}>
                        {msg.conteudo}
                      </div>
                      {msg.role === "user" && (
                        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-4 w-4 text-secondary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlertDetailDialog;
