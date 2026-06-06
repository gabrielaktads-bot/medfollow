import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProntuario } from "@/hooks/useProntuario";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  ArrowLeft, Calendar, FileText, Stethoscope, Plus, Clock, User,
  Upload, Eye, EyeOff, MessageCircle, Bot, Pill, Scissors, Link, Share2, ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Patient } from "@/hooks/usePatients";

const tiposEntrada = [
  { value: "nota", label: "Nota" },
  { value: "prescricao", label: "Prescrição" },
  { value: "exame", label: "Exame" },
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "observacao", label: "Observação" },
  { value: "procedimento", label: "Procedimento" },
];

const tipoBadgeColor: Record<string, string> = {
  nota: "bg-blue-100 text-blue-800",
  prescricao: "bg-green-100 text-green-800",
  exame: "bg-purple-100 text-purple-800",
  diagnostico: "bg-orange-100 text-orange-800",
  observacao: "bg-gray-100 text-gray-800",
  procedimento: "bg-red-100 text-red-800",
};

const PatientProntuario = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const {
    entradas, agendamentos, diagnosticos, arquivos, docsCompartilhados, chatHistory,
    isLoading: prontuarioLoading, addEntrada, addDiagnostico, addArquivo,
    toggleArquivoVisibilidade, addDocumentoCompartilhado,
  } = useProntuario(patientId);

  // Prontuário form
  const [tipo, setTipo] = useState("nota");
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");

  // Diagnóstico form
  const [diagOpen, setDiagOpen] = useState(false);
  const [diagData, setDiagData] = useState(format(new Date(), "yyyy-MM-dd"));
  const [diagResumo, setDiagResumo] = useState("");
  const [diagCompleto, setDiagCompleto] = useState("");
  const [diagReceita, setDiagReceita] = useState("");

  // File upload
  const [fileUploading, setFileUploading] = useState(false);
  const [fileDescricao, setFileDescricao] = useState("");
  const [fileCompartilhado, setFileCompartilhado] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Doc compartilhado form
  const [docOpen, setDocOpen] = useState(false);
  const [docTipo, setDocTipo] = useState("procedimento");
  const [docTitulo, setDocTitulo] = useState("");
  const [docConteudo, setDocConteudo] = useState("");

  const patientQuery = useQuery({
    queryKey: ["patient-detail", patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const { data, error } = await supabase
        .from("cadastros")
        .select("*")
        .eq("id", patientId)
        .maybeSingle();
      if (error) throw error;
      return data as Patient | null;
    },
    enabled: !!patientId,
  });

  const patient = patientQuery.data;

  const handleSubmitEntrada = () => {
    if (!patientId || !titulo.trim() || !conteudo.trim()) return;
    addEntrada.mutate(
      { paciente_id: patientId, tipo, titulo: titulo.trim(), conteudo: conteudo.trim() },
      { onSuccess: () => { setTitulo(""); setConteudo(""); setTipo("nota"); } }
    );
  };

  const handleSubmitDiagnostico = () => {
    if (!patientId || !diagResumo.trim()) return;
    addDiagnostico.mutate(
      {
        paciente_id: patientId,
        data: diagData,
        ultima_avaliacao_resumo: diagResumo.trim(),
        ultima_avaliacao_completo: diagCompleto.trim() || undefined,
        receita_passada: diagReceita.trim() || undefined,
      },
      {
        onSuccess: () => {
          setDiagOpen(false);
          setDiagResumo("");
          setDiagCompleto("");
          setDiagReceita("");
          setDiagData(format(new Date(), "yyyy-MM-dd"));
        },
      }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patientId) return;
    setFileUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${patientId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("documentos-paciente")
      .upload(path, file);
    if (uploadError) {
      setFileUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("documentos-paciente").getPublicUrl(path);
    addArquivo.mutate(
      {
        paciente_id: patientId,
        nome_arquivo: file.name,
        url: urlData.publicUrl,
        tipo: file.type.includes("image") ? "imagem" : "documento",
        descricao: fileDescricao.trim() || undefined,
        compartilhado_com_paciente: fileCompartilhado,
      },
      {
        onSuccess: () => {
          setFileDescricao("");
          setFileCompartilhado(false);
          setFileUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
        onError: () => setFileUploading(false),
      }
    );
  };

  const handleCreateDocCompartilhado = () => {
    if (!patientId || !docTitulo.trim()) return;
    addDocumentoCompartilhado.mutate(
      {
        paciente_id: patientId,
        tipo: docTipo,
        titulo: docTitulo.trim(),
        conteudo: docConteudo.trim() || undefined,
      },
      {
        onSuccess: () => {
          setDocOpen(false);
          setDocTitulo("");
          setDocConteudo("");
          setDocTipo("procedimento");
        },
      }
    );
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/doc/${token}`;
    navigator.clipboard.writeText(url);
    import("@/hooks/use-toast").then(({ toast }) =>
      toast({ title: "Link copiado para a área de transferência" })
    );
  };

  if (patientQuery.isLoading || prontuarioLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/clinic/patients")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <p className="text-muted-foreground">Paciente não encontrado.</p>
      </div>
    );
  }

  const idade = patient.data_de_nascimento
    ? Math.floor((Date.now() - new Date(patient.data_de_nascimento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clinic/patients")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">
            Prontuário — {patient.nome} {patient.sobrenome || ""}
          </h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            {patient.telefone && <span>📞 {patient.telefone}</span>}
            {patient.genero && <span className="capitalize">⚧ {patient.genero}</span>}
            {idade !== null && <span>🎂 {idade} anos</span>}
            <Badge variant={patient.ativo ? "default" : "secondary"}>
              {patient.ativo ? "Ativo" : "Pausado"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="prontuario" className="w-full">
        <TabsList className="grid grid-cols-3 lg:grid-cols-7 w-full">
          <TabsTrigger value="prontuario">Prontuário</TabsTrigger>
          <TabsTrigger value="diagnosticos">Diagnósticos</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
          <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="consultas">Consultas</TabsTrigger>
        </TabsList>

        {/* ========== PRONTUÁRIO ========== */}
        <TabsContent value="prontuario" className="space-y-6 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Plus className="h-4 w-4" /> Nova Entrada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    {tiposEntrada.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Título da entrada" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <Textarea placeholder="Conteúdo detalhado..." value={conteudo} onChange={(e) => setConteudo(e.target.value)} rows={4} />
              <Button onClick={handleSubmitEntrada} disabled={!titulo.trim() || !conteudo.trim() || addEntrada.isPending} size="sm">
                {addEntrada.isPending ? "Salvando..." : "Adicionar Entrada"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" /> Prontuário ({entradas.length} {entradas.length === 1 ? "entrada" : "entradas"})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entradas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma entrada no prontuário ainda.</p>
              ) : (
                <div className="space-y-4">
                  {entradas.map((e) => (
                    <div key={e.id} className="relative pl-6 pb-4 border-l-2 border-muted last:border-l-0 last:pb-0">
                      <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoBadgeColor[e.tipo] || "bg-muted text-muted-foreground"}`}>
                          {tiposEntrada.find((t) => t.value === e.tipo)?.label || e.tipo}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(e.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm">{e.titulo}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{e.conteudo}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== DIAGNÓSTICOS ========== */}
        <TabsContent value="diagnosticos" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Diagnósticos ({diagnosticos.length})</h3>
            <Dialog open={diagOpen} onOpenChange={setDiagOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Diagnóstico</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Registrar Diagnóstico</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Data</Label>
                    <Input type="date" value={diagData} onChange={(e) => setDiagData(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Hipótese Diagnóstica / Resumo *</Label>
                    <Textarea value={diagResumo} onChange={(e) => setDiagResumo(e.target.value)} rows={3} className="mt-1"
                      placeholder="CID, hipótese diagnóstica, resumo clínico..." />
                  </div>
                  <div>
                    <Label>Avaliação Completa</Label>
                    <Textarea value={diagCompleto} onChange={(e) => setDiagCompleto(e.target.value)} rows={4} className="mt-1"
                      placeholder="Anamnese, exame físico, exames complementares, conduta..." />
                  </div>
                  <div>
                    <Label>Receita / Prescrição</Label>
                    <Textarea value={diagReceita} onChange={(e) => setDiagReceita(e.target.value)} rows={3} className="mt-1"
                      placeholder="Medicamentos, posologia, orientações..." />
                  </div>
                  <Button onClick={handleSubmitDiagnostico} disabled={!diagResumo.trim() || addDiagnostico.isPending}>
                    {addDiagnostico.isPending ? "Salvando..." : "Registrar Diagnóstico"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {diagnosticos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum diagnóstico registrado.</p>
          ) : (
            <div className="space-y-3">
              {diagnosticos.map((d: any) => (
                <Card key={d.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {d.data ? format(new Date(d.data + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }) : format(new Date(d.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(d.created_at), "HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {d.ultima_avaliacao_resumo && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Hipótese Diagnóstica</p>
                        <p className="text-sm whitespace-pre-wrap">{d.ultima_avaliacao_resumo}</p>
                      </div>
                    )}
                    {d.receita_passada && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Receita</p>
                        <p className="text-sm whitespace-pre-wrap">{d.receita_passada}</p>
                      </div>
                    )}
                    {d.ultima_avaliacao_completo && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-primary text-xs font-medium">Ver avaliação completa</summary>
                        <p className="mt-1 text-sm whitespace-pre-wrap">{d.ultima_avaliacao_completo}</p>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========== RECEITAS ========== */}
        <TabsContent value="receitas" className="space-y-4 mt-4">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Pill className="h-4 w-4" /> Receitas / Prescrições</h3>
          {(() => {
            const receitas = diagnosticos.filter((d: any) => d.receita_passada);
            const receitasEntradas = entradas.filter(e => e.tipo === "prescricao");
            const all = [
              ...receitas.map((d: any) => ({ id: d.id, tipo: "diagnostico", data: d.data || d.created_at, conteudo: d.receita_passada, resumo: d.ultima_avaliacao_resumo })),
              ...receitasEntradas.map(e => ({ id: e.id, tipo: "entrada", data: e.created_at, conteudo: e.conteudo, resumo: e.titulo })),
            ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
            if (all.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma receita registrada. Receitas adicionadas em diagnósticos ou prescrições no prontuário aparecerão aqui.</p>;
            return (
              <div className="space-y-3">
                {all.map(r => (
                  <Card key={r.id}>
                    <CardContent className="p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {format(new Date(r.data.includes("T") ? r.data : r.data + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <Badge variant="outline" className="text-xs">{r.tipo === "diagnostico" ? "Diagnóstico" : "Prescrição"}</Badge>
                      </div>
                      {r.resumo && <p className="text-xs text-muted-foreground">{r.resumo}</p>}
                      <p className="text-sm whitespace-pre-wrap">{r.conteudo}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </TabsContent>

        {/* ========== PROCEDIMENTOS / DOCS COMPARTILHADOS ========== */}
        <TabsContent value="procedimentos" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Scissors className="h-4 w-4" /> Procedimentos & Documentos Compartilhados</h3>
            <Dialog open={docOpen} onOpenChange={setDocOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Documento</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Criar Documento Compartilhável</DialogTitle></DialogHeader>
                <p className="text-xs text-muted-foreground mb-2">
                  Um link único será gerado para que o paciente possa acessar este documento. O agente de IA poderá enviá-lo automaticamente.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={docTipo} onValueChange={setDocTipo}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="procedimento">Procedimento</SelectItem>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="laudo">Laudo</SelectItem>
                        <SelectItem value="atestado">Atestado</SelectItem>
                        <SelectItem value="orientacao">Orientação</SelectItem>
                        <SelectItem value="encaminhamento">Encaminhamento</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Título *</Label>
                    <Input value={docTitulo} onChange={(e) => setDocTitulo(e.target.value)} className="mt-1" placeholder="Ex: Laudo de exame de sangue" />
                  </div>
                  <div>
                    <Label>Conteúdo</Label>
                    <Textarea value={docConteudo} onChange={(e) => setDocConteudo(e.target.value)} rows={5} className="mt-1"
                      placeholder="Conteúdo completo do documento..." />
                  </div>
                  <Button onClick={handleCreateDocCompartilhado} disabled={!docTitulo.trim() || addDocumentoCompartilhado.isPending}>
                    {addDocumentoCompartilhado.isPending ? "Criando..." : "Criar Documento"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Prontuário entries of type procedimento */}
          {(() => {
            const procedEntradas = entradas.filter(e => e.tipo === "procedimento");
            return procedEntradas.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Procedimentos do Prontuário</p>
                {procedEntradas.map(e => (
                  <Card key={e.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{e.titulo}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(e.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{e.conteudo}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}

          {/* Docs compartilhados */}
          {docsCompartilhados.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Documentos com Link Compartilhável</p>
              {docsCompartilhados.map((d: any) => (
                <Card key={d.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{d.tipo}</Badge>
                        <span className="font-medium text-sm">{d.titulo}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyLink(d.link_token)} title="Copiar link">
                          <Link className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-muted-foreground">{format(new Date(d.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    </div>
                    {d.conteudo && <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{d.conteudo}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {entradas.filter(e => e.tipo === "procedimento").length === 0 && docsCompartilhados.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum procedimento ou documento compartilhável registrado.</p>
          )}
        </TabsContent>

        {/* ========== ARQUIVOS ========== */}
        <TabsContent value="arquivos" className="space-y-4 mt-4">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Upload className="h-4 w-4" /> Arquivos</h3>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Arquivo</Label>
                  <Input type="file" ref={fileInputRef} onChange={handleFileUpload} className="mt-1" disabled={fileUploading} />
                </div>
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Input value={fileDescricao} onChange={(e) => setFileDescricao(e.target.value)} className="mt-1" placeholder="Descrição do arquivo" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={fileCompartilhado} onCheckedChange={setFileCompartilhado} />
                <Label className="text-sm">Compartilhar com o paciente</Label>
                {fileCompartilhado ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              </div>
              {fileUploading && <p className="text-xs text-muted-foreground">Enviando arquivo...</p>}
            </CardContent>
          </Card>

          {arquivos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum arquivo adicionado.</p>
          ) : (
            <div className="space-y-2">
              {arquivos.map((a: any) => (
                <Card key={a.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                          {a.nome_arquivo} <ExternalLink className="h-3 w-3" />
                        </a>
                        {a.descricao && <p className="text-xs text-muted-foreground">{a.descricao}</p>}
                        <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => toggleArquivoVisibilidade.mutate({ id: a.id, compartilhado: !a.compartilhado_com_paciente })}
                        title={a.compartilhado_com_paciente ? "Tornar interno" : "Compartilhar com paciente"}
                      >
                        {a.compartilhado_com_paciente ? (
                          <><Eye className="h-4 w-4 mr-1" /> Compartilhado</>
                        ) : (
                          <><EyeOff className="h-4 w-4 mr-1" /> Interno</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========== CHAT HISTORY ========== */}
        <TabsContent value="chat" className="mt-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4"><MessageCircle className="h-4 w-4" /> Histórico de Chat com o Agente</h3>
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px] p-4">
                {chatHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mensagem encontrada.</p>
                ) : (
                  <div className="space-y-3">
                    {chatHistory.map((msg: any) => (
                      <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                          <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm whitespace-pre-wrap ${
                          msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== CONSULTAS ========== */}
        <TabsContent value="consultas" className="space-y-4 mt-4">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" /> Consultas ({agendamentos.length})</h3>
          {agendamentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma consulta registrada.</p>
          ) : (
            <div className="space-y-2">
              {agendamentos.map((a: any) => (
                <Card key={a.id}>
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {a.data_do_agendamento
                          ? format(new Date(a.data_do_agendamento + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })
                          : a.data
                          ? format(new Date(a.data + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })
                          : "Sem data"}
                      </span>
                      {(a as any).hora && (
                        <span className="text-sm text-muted-foreground">{(a as any).hora}</span>
                      )}
                    </div>
                    {a.informacoes_adicionais && <p className="text-sm text-muted-foreground">{a.informacoes_adicionais}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientProntuario;
