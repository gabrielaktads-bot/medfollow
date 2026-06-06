import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Pencil, FileText } from "lucide-react";

const templates = [
  { id: 1, name: "Pós-operatório Geral", steps: ["D+1", "D+3", "D+7", "D+14", "D+30"], specialty: "Cirurgia Geral", locked: true },
  { id: 2, name: "Pós Rinoplastia", steps: ["D+1", "D+2", "D+5", "D+10", "D+30"], specialty: "Cirurgia Plástica", locked: true },
  { id: 3, name: "Acompanhamento Bariátrica", steps: ["D+1", "D+3", "D+7", "D+15", "D+30", "D+60", "D+90"], specialty: "Cirurgia Bariátrica", locked: false },
  { id: 4, name: "Pós Implante Dentário", steps: ["D+1", "D+3", "D+7", "D+14"], specialty: "Odontologia", locked: false },
];

const AdminTemplates = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Templates de Fluxo</h2>
        <Button size="sm">+ Novo Template</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((t) => (
          <div key={t.id} className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {t.name}
                </h3>
                <p className="text-sm text-muted-foreground">{t.specialty}</p>
              </div>
              {t.locked && <Badge variant="secondary">Padrão</Badge>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {t.steps.map((s) => (
                <span key={s} className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{s}</span>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm"><Pencil className="h-3 w-3 mr-1" /> Editar</Button>
              <Button variant="outline" size="sm"><Copy className="h-3 w-3 mr-1" /> Copiar</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTemplates;
