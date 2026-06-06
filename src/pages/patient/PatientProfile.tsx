import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FileText, ExternalLink, Download, Link, Eye } from "lucide-react";
import { maskPhone, maskCEP } from "@/lib/masks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const PatientProfile = () => {
  const { activeCadastro, loading: roleLoading } = useRole();
  const { user } = useAuth();
  const [form, setForm] = useState({
    nome: "", sobrenome: "", telefone: "", genero: "",
    data_de_nascimento: "", cep: "", rua: "", numero_da_rua: "",
    complemento: "", bairro: "", cidade: "", estado: "",
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!activeCadastro?.id) return;
    supabase.from("cadastros")
      .select("nome, sobrenome, telefone, genero, data_de_nascimento, cep, rua, numero_da_rua, complemento, bairro, cidade, estado")
      .eq("id", activeCadastro.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            nome: data.nome || "", sobrenome: data.sobrenome || "",
            telefone: data.telefone || "", genero: data.genero || "",
            data_de_nascimento: data.data_de_nascimento || "",
            cep: data.cep || "", rua: data.rua || "",
            numero_da_rua: data.numero_da_rua || "", complemento: data.complemento || "",
            bairro: data.bairro || "", cidade: data.cidade || "", estado: data.estado || "",
          });
        }
        setLoaded(true);
      });
  }, [activeCadastro?.id]);

  // Fetch shared documents
  const docsQuery = useQuery({
    queryKey: ["patient-docs-compartilhados", activeCadastro?.id],
    queryFn: async () => {
      if (!activeCadastro?.id) return [];
      const { data, error } = await supabase
        .from("documentos_compartilhados" as any)
        .select("*")
        .eq("paciente_id", activeCadastro.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!activeCadastro?.id,
  });

  // Fetch shared files
  const filesQuery = useQuery({
    queryKey: ["patient-arquivos-compartilhados", activeCadastro?.id],
    queryFn: async () => {
      if (!activeCadastro?.id) return [];
      const { data, error } = await supabase
        .from("arquivos_paciente" as any)
        .select("*")
        .eq("paciente_id", activeCadastro.id)
        .eq("compartilhado_com_paciente", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!activeCadastro?.id,
  });

  const handleSave = async () => {
    if (!activeCadastro?.id) return;
    setSaving(true);
    const { error } = await supabase.from("cadastros").update(form).eq("id", activeCadastro.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado com sucesso" });
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const copyDocLink = (token: string) => {
    const url = `${window.location.origin}/doc/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado" });
  };

  if (roleLoading || !loaded) {
    return <div className="space-y-4 max-w-2xl"><Skeleton className="h-7 w-40" /><Skeleton className="h-64 w-full" /></div>;
  }

  const docs = docsQuery.data || [];
  const files = filesQuery.data || [];

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold">Meu Perfil</h2>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Dados Pessoais</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Nome</Label><Input value={form.nome} onChange={set("nome")} className="mt-1" /></div>
          <div><Label>Sobrenome</Label><Input value={form.sobrenome} onChange={set("sobrenome")} className="mt-1" /></div>
          <div><Label>E-mail</Label><Input value={user?.email || ""} disabled className="mt-1" /></div>
          <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm(p => ({ ...p, telefone: maskPhone(e.target.value) }))} placeholder="(11) 99999-9999" className="mt-1" /></div>
          <div>
            <Label>Gênero</Label>
            <Select value={form.genero} onValueChange={v => setForm(p => ({ ...p, genero: v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data de Nascimento</Label>
            <Input type="date" value={form.data_de_nascimento} onChange={set("data_de_nascimento")} className="mt-1" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Endereço</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>CEP</Label><Input value={form.cep} onChange={(e) => setForm(p => ({ ...p, cep: maskCEP(e.target.value) }))} placeholder="00000-000" className="mt-1" /></div>
          <div><Label>Rua</Label><Input value={form.rua} onChange={set("rua")} className="mt-1" /></div>
          <div><Label>Número</Label><Input value={form.numero_da_rua} onChange={set("numero_da_rua")} className="mt-1" /></div>
          <div><Label>Complemento</Label><Input value={form.complemento} onChange={set("complemento")} className="mt-1" /></div>
          <div><Label>Bairro</Label><Input value={form.bairro} onChange={set("bairro")} className="mt-1" /></div>
          <div><Label>Cidade</Label><Input value={form.cidade} onChange={set("cidade")} className="mt-1" /></div>
          <div>
            <Label>Estado</Label>
            <Select value={form.estado} onValueChange={v => setForm(p => ({ ...p, estado: v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>
                {ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar Alterações"}</Button>

      {/* ========== DOCUMENTOS & ARQUIVOS COMPARTILHADOS ========== */}
      {(docs.length > 0 || files.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" /> Meus Documentos
          </h2>

          {docs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Documentos</h3>
              {docs.map((d: any) => (
                <Card key={d.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs capitalize">{d.tipo}</Badge>
                        <span className="font-medium text-sm">{d.titulo}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(d.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      {d.conteudo && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{d.conteudo}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyDocLink(d.link_token)} title="Copiar link">
                        <Link className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Abrir">
                        <a href={`/doc/${d.link_token}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Arquivos</h3>
              {files.map((f: any) => (
                <Card key={f.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{f.nome_arquivo}</p>
                        {f.descricao && <p className="text-xs text-muted-foreground">{f.descricao}</p>}
                        <p className="text-xs text-muted-foreground">{format(new Date(f.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={f.url} target="_blank" rel="noopener noreferrer" title="Abrir arquivo">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
