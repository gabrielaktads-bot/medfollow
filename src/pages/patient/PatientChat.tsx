import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PatientChat = () => {
  const { activeCadastro } = useRole();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pacienteId = activeCadastro?.id;

  // Load chat history from DB
  const { data: historyData } = useQuery({
    queryKey: ["my_chat_history", pacienteId],
    queryFn: async () => {
      if (!pacienteId) return [];
      const { data, error } = await supabase
        .from("mensagens_chat")
        .select("role, conteudo")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((m) => ({ role: m.role as "user" | "assistant", content: m.conteudo }));
    },
    enabled: !!pacienteId,
  });

  // Track if we've loaded from DB to avoid overwriting user's current session
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    if (historyData && historyData.length > 0 && !historyLoaded) {
      setMessages(historyData);
      setHistoryLoaded(true);
    } else if (historyData && historyData.length === 0 && !historyLoaded) {
      setHistoryLoaded(true);
    }
  }, [historyData, historyLoaded]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("patient-chat", {
        body: { input: text },
      });

      if (error) throw error;

      if (data?.content) {
        setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
      } else if (data?.error) {
        setMessages(prev => [...prev, { role: "assistant", content: `Erro: ${data.error}` }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl">
      <h2 className="text-lg font-semibold mb-4">Assistente de Saúde</h2>

      <div className="flex-1 rounded-lg border bg-card overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                Olá! Sou seu assistente de saúde. Posso ajudar com dúvidas sobre seus procedimentos, medicamentos e orientações gerais.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                ⚠️ Este chat não substitui uma consulta médica.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 items-center">
                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-3 flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Digite sua dúvida..."
            disabled={isLoading}
          />
          <Button size="icon" onClick={send} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PatientChat;
