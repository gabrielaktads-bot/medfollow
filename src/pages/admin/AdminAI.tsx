import { Brain, Sparkles, AlertTriangle, BarChart3, MessageCircle, Lightbulb } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Geração Automática de Templates",
    description: "IA gera fluxos de acompanhamento com base na especialidade e procedimento informado pelo médico.",
  },
  {
    icon: Brain,
    title: "Ajuste Dinâmico de Fluxos",
    description: "Os fluxos se adaptam automaticamente conforme as respostas dos pacientes, personalizando o acompanhamento.",
  },
  {
    icon: AlertTriangle,
    title: "Detecção de Palavras-chave Críticas",
    description: 'Identifica automaticamente termos como "dor intensa", "sangramento", "febre" nas respostas abertas dos pacientes.',
  },
  {
    icon: BarChart3,
    title: "Recomendação de Melhorias",
    description: "Analisa desempenho dos fluxos e sugere otimizações com base em taxas de resposta e engajamento.",
  },
  {
    icon: MessageCircle,
    title: "Respostas Automáticas Sugeridas",
    description: "Sugere mensagens de resposta para confirmação do profissional, agilizando o atendimento.",
  },
  {
    icon: Lightbulb,
    title: "Análise de Gravidade",
    description: "Classifica alertas por gravidade com base no histórico de casos semelhantes na plataforma.",
  },
];

const AdminAI = () => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Inteligência Artificial</h2>
        <p className="text-sm text-muted-foreground">Módulos de IA integrados ao MedFollow</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <div key={i} className="rounded-lg border bg-card p-5 space-y-3 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="inline-flex rounded-lg bg-accent p-2.5">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">{f.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAI;
