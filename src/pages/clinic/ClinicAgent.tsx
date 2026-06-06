import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { maskPhone } from "@/lib/masks";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Bot, X, Plus, Phone, HelpCircle, Trash2, Thermometer } from "lucide-react";
import { useAgenteConfig, type AgenteConfigFormData, type PerguntaResposta } from "@/hooks/useAgenteConfig";

const ClinicAgent = () => {
  const { config, isLoading, upsertConfig } = useAgenteConfig();
  const [nomeAgente, setNomeAgente] = useState("Assistente de Saúde");
  const [orientacoes, setOrientacoes] = useState("");
  const [palavrasCriticas, setPalavrasCriticas] = useState<string[]>([]);
  const [novaPalavra, setNovaPalavra] = useState("");
  const [perguntasRespostas, setPerguntasRespostas] = useState<PerguntaResposta[]>([]);
  const [novaPergunta, setNovaPergunta] = useState("");
  const [novaResposta, setNovaResposta] = useState("");
  const [contatoEmergencia, setContatoEmergencia] = useState("");
  const [temperatura, setTemperatura] = useState(0.7);

  useEffect(() => {
    if (config) {
      setNomeAgente(config.nome_agente || "Assistente de Saúde");
      setOrientacoes(config.orientacoes || "");
      setPalavrasCriticas(config.palavras_criticas || []);
      setPerguntasRespostas(config.perguntas_respostas || []);
      setContatoEmergencia(config.contato_emergencia || "");
      setTemperatura(config.temperatura ?? 0.7);
    }
  }, [config]);

  const addPalavra = () => {
    const word = novaPalavra.trim().toLowerCase();
    if (word && !palavrasCriticas.includes(word)) {
      setPalavrasCriticas((prev) => [...prev, word]);
      setNovaPalavra("");
    }
  };

  const removePalavra = (word: string) => {
    setPalavrasCriticas((prev) => prev.filter((w) => w !== word));
  };

  const addPerguntaResposta = () => {
    const p = novaPergunta.trim();
    const r = novaResposta.trim();
    if (p && r) {
      setPerguntasRespostas((prev) => [...prev, { pergunta: p, resposta: r }]);
      setNovaPergunta("");
      setNovaResposta("");
    }
  };

  const removePerguntaResposta = (index: number) => {
    setPerguntasRespostas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const formData: AgenteConfigFormData = {
      nome_agente: nomeAgente,
      orientacoes,
      palavras_criticas: palavrasCriticas,
      perguntas_respostas: perguntasRespostas,
      contato_emergencia: contatoEmergencia,
      temperatura,
    };
    upsertConfig.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Bot className="h-6 w-6 text-primary" />
        <h2 className="text-lg font-semibold">Configuração do Agente IA</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identidade do Agente</CardTitle>
          <CardDescription>
            Configure o nome e as instruções que o agente seguirá ao conversar com os pacientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_agente">Nome do Agente</Label>
            <Input
              id="nome_agente"
              value={nomeAgente}
              onChange={(e) => setNomeAgente(e.target.value)}
              placeholder="Ex: Assistente Dr. Silva"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orientacoes">Orientações / Instruções</Label>
            <Textarea
              id="orientacoes"
              value={orientacoes}
              onChange={(e) => setOrientacoes(e.target.value)}
              placeholder="Descreva como o agente deve se comportar, quais informações pode fornecer, tom de comunicação, etc."
              className="min-h-[160px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Palavras Críticas</CardTitle>
          <CardDescription>
            Quando o paciente usar alguma dessas palavras, uma notificação será gerada automaticamente para a equipe médica.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={novaPalavra}
              onChange={(e) => setNovaPalavra(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPalavra())}
              placeholder="Digite uma palavra e pressione Enter"
            />
            <Button variant="outline" size="icon" onClick={addPalavra} type="button">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {palavrasCriticas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {palavrasCriticas.map((word) => (
                <Badge key={word} variant="secondary" className="gap-1 pr-1">
                  {word}
                  <button
                    onClick={() => removePalavra(word)}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {palavrasCriticas.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma palavra crítica configurada. Exemplos: "suicídio", "dor intensa", "sangramento".
            </p>
          )}
        </CardContent>
      </Card>

      {/* Perguntas e Respostas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" /> Perguntas e Respostas
          </CardTitle>
          <CardDescription>
            Adicione perguntas frequentes e suas respostas. O agente usará essas informações como base ao responder os pacientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 border rounded-md p-3 bg-muted/30">
            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Input
                value={novaPergunta}
                onChange={(e) => setNovaPergunta(e.target.value)}
                placeholder="Ex: Qual o horário de funcionamento da clínica?"
              />
            </div>
            <div className="space-y-2">
              <Label>Resposta</Label>
              <Textarea
                value={novaResposta}
                onChange={(e) => setNovaResposta(e.target.value)}
                placeholder="Ex: A clínica funciona de segunda a sexta, das 8h às 18h."
                rows={3}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addPerguntaResposta}
              disabled={!novaPergunta.trim() || !novaResposta.trim()}
              type="button"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>

          {perguntasRespostas.length > 0 ? (
            <div className="space-y-3">
              {perguntasRespostas.map((pr, i) => (
                <div key={i} className="border rounded-md p-3 space-y-1 relative group">
                  <button
                    onClick={() => removePerguntaResposta(i)}
                    className="absolute top-2 right-2 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <p className="text-sm font-medium">P: {pr.pergunta}</p>
                  <p className="text-sm text-muted-foreground">R: {pr.resposta}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma pergunta/resposta configurada. Adicione para que o agente possa responder com mais precisão.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Temperatura do Agente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" /> Temperatura do Agente
          </CardTitle>
          <CardDescription>
            Controle o nível de criatividade das respostas do agente. Valores próximos de <strong>0</strong> tornam as respostas mais determinísticas e previsíveis.
            Valores próximos de <strong>1</strong> deixam o agente mais livre e criativo nas respostas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Determinístico</span>
              <span className="font-medium text-foreground text-base">{temperatura.toFixed(1)}</span>
              <span>Criativo</span>
            </div>
            <Slider
              value={[temperatura]}
              onValueChange={(v) => setTemperatura(v[0])}
              min={0}
              max={1}
              step={0.1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contato de Emergência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" /> Contato de Emergência
          </CardTitle>
          <CardDescription>
            Número ou contato que o agente enviará ao paciente em situações críticas ou de emergência.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={contatoEmergencia}
            onChange={(e) => setContatoEmergencia(maskPhone(e.target.value))}
            placeholder="(11) 99999-9999"
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={upsertConfig.isPending}>
        {upsertConfig.isPending ? "Salvando..." : "Salvar Configuração"}
      </Button>
    </div>
  );
};

export default ClinicAgent;
