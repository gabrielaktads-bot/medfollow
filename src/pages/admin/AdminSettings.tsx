import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Webhook, Settings2 } from "lucide-react";

const AdminSettings = () => {
  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold">Configurações do Sistema</h2>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" /> Mensagens Padrão
        </h3>
        <div className="space-y-3">
          <div>
            <Label>Mensagem de boas-vindas</Label>
            <Textarea defaultValue="Olá! Bem-vindo ao MedFollow. Estamos aqui para acompanhar sua recuperação." className="mt-1" />
          </div>
          <div>
            <Label>Mensagem de alerta</Label>
            <Textarea defaultValue="Identificamos uma resposta que requer atenção. Nossa equipe foi notificada." className="mt-1" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" /> Intervalos por Especialidade
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Cirurgia Geral (dias)</Label>
            <Input defaultValue="1, 3, 7, 14, 30" className="mt-1" />
          </div>
          <div>
            <Label>Cirurgia Plástica (dias)</Label>
            <Input defaultValue="1, 2, 5, 10, 30" className="mt-1" />
          </div>
          <div>
            <Label>Ortopedia (dias)</Label>
            <Input defaultValue="1, 3, 7, 15, 30, 60" className="mt-1" />
          </div>
          <div>
            <Label>Bariátrica (dias)</Label>
            <Input defaultValue="1, 3, 7, 15, 30, 60, 90" className="mt-1" />
          </div>
        </div>
      </div>

      <Separator />

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Webhook className="h-4 w-4 text-primary" /> Integrações
        </h3>
        <div className="space-y-3">
          <div>
            <Label>WhatsApp API Token</Label>
            <Input type="password" defaultValue="••••••••••••" className="mt-1" />
          </div>
          <div>
            <Label>Webhook URL</Label>
            <Input defaultValue="https://api.medfollow.com.br/webhook" className="mt-1" />
          </div>
        </div>
      </div>

      <Button>Salvar Configurações</Button>
    </div>
  );
};

export default AdminSettings;
