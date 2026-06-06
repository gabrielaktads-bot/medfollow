import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Diagnostico {
  id: string;
  data: string | null;
  ultima_avaliacao_resumo: string | null;
  ultima_avaliacao_completo: string | null;
  receita_passada: string | null;
  medico_nome?: string;
}

interface DocCompartilhado {
  id: string;
  tipo: string;
  titulo: string;
  conteudo: string | null;
  link_token: string | null;
  created_at: string | null;
}

const PatientProcedures = () => {
  const { activeCadastro, loading: roleLoading } = useRole();
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [docs, setDocs] = useState<DocCompartilhado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCadastro?.id) return;

    const fetchAll = async () => {
      setLoading(true);

      // Fetch diagnosticos
      const { data: diagData } = await supabase
        .from("diagnosticos")
        .select("id, data, ultima_avaliacao_resumo, ultima_avaliacao_completo, receita_passada, medico_id")
        .eq("paciente_id", activeCadastro.id)
        .order("data", { ascending: false });

      if (diagData) {
        const medicoIds = [...new Set(diagData.filter(d => d.medico_id).map(d => d.medico_id!))];
        let medicoMap: Record<string, string> = {};
        if (medicoIds.length > 0) {
          const { data: medicos } = await supabase
            .from("cadastros")
            .select("id, nome, sobrenome")
            .in("id", medicoIds);
          if (medicos) {
            medicoMap = Object.fromEntries(
              medicos.map(m => [m.id, [m.nome, m.sobrenome].filter(Boolean).join(" ")])
            );
          }
        }
        setDiagnosticos(diagData.map(d => ({
          ...d,
          medico_nome: d.medico_id ? medicoMap[d.medico_id] || "Médico" : undefined,
        })));
      }

      // Fetch documentos compartilhados
      const { data: docsData } = await supabase
        .from("documentos_compartilhados" as any)
        .select("id, tipo, titulo, conteudo, link_token, created_at")
        .eq("paciente_id", activeCadastro.id)
        .order("created_at", { ascending: false });

      if (docsData) {
        setDocs(docsData as any[]);
      }

      setLoading(false);
    };

    fetchAll();
  }, [activeCadastro?.id]);

  if (roleLoading || loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-7 w-48" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }

  const hasDiag = diagnosticos.length > 0;
  const hasDocs = docs.length > 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-lg font-semibold">Meus Procedimentos</h2>

      {!hasDiag && !hasDocs ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum procedimento encontrado.</p>
        </div>
      ) : (
        <>
          {/* Documentos compartilhados */}
          {hasDocs && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Documentos</h3>
              {docs.map(d => (
                <div key={d.id} className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{d.titulo}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{d.tipo}</span>
                    </div>
                    {d.created_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(d.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                  {d.conteudo && <p className="text-sm whitespace-pre-wrap">{d.conteudo}</p>}
                  {d.link_token && (
                    <Button
                      variant="outline" size="sm"
                      onClick={() => window.open(`${window.location.origin}/doc/${d.link_token}`, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" /> Abrir documento
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Diagnósticos */}
          {hasDiag && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Diagnósticos</h3>
              {diagnosticos.map(d => (
                <div key={d.id} className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {d.data ? format(new Date(d.data + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Sem data"}
                    </span>
                    {d.medico_nome && (
                      <span className="text-xs text-muted-foreground">Dr(a). {d.medico_nome}</span>
                    )}
                  </div>
                  {d.ultima_avaliacao_resumo && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">Resumo</p>
                      <p className="text-sm">{d.ultima_avaliacao_resumo}</p>
                    </div>
                  )}
                  {d.receita_passada && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">Receita</p>
                      <p className="text-sm">{d.receita_passada}</p>
                    </div>
                  )}
                  {d.ultima_avaliacao_completo && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-primary text-xs font-medium">Ver avaliação completa</summary>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{d.ultima_avaliacao_completo}</p>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientProcedures;