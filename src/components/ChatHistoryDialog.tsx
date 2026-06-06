import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, User } from "lucide-react";

interface ChatHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string | null;
  pacienteNome: string;
}

const ChatHistoryDialog = ({ open, onOpenChange, pacienteId, pacienteNome }: ChatHistoryDialogProps) => {
  const { data: messages, isLoading } = useQuery({
    queryKey: ["chat_history", pacienteId],
    queryFn: async () => {
      if (!pacienteId) return [];
      const { data, error } = await supabase
        .from("mensagens_chat")
        .select("id, role, conteudo, created_at")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!pacienteId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Histórico de Chat — {pacienteNome}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-3/4" />)}
            </div>
          ) : !messages || messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma mensagem encontrada.
            </p>
          ) : (
            <div className="space-y-3 py-4">
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
      </DialogContent>
    </Dialog>
  );
};

export default ChatHistoryDialog;
