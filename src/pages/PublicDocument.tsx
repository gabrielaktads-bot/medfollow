import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SUPABASE_URL = "https://ovqzhrseppxmbtxkcxtt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cXpocnNlcHB4bWJ0eGtjeHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTg2ODIsImV4cCI6MjA4OTE5NDY4Mn0.CFtWVB5yF6bZeOwgsFGLTDlr5w6O16lR7D_HXuM4EBc";

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PublicDocument = () => {
  const { token } = useParams<{ token: string }>();

  const { data: doc, isLoading } = useQuery({
    queryKey: ["public-doc", token],
    queryFn: async () => {
      if (!token) return null;
      const { data, error } = await anonClient
        .from("documentos_compartilhados")
        .select("*")
        .eq("link_token", token)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-semibold">Documento não encontrado</h1>
          <p className="text-muted-foreground">Este link pode ter expirado ou não existe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 flex justify-center">
      <div className="w-full max-w-2xl py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="capitalize">{doc.tipo}</Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            <CardTitle>{doc.titulo}</CardTitle>
          </CardHeader>
          <CardContent>
            {doc.conteudo ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{doc.conteudo}</p>
            ) : (
              <p className="text-muted-foreground text-sm">Sem conteúdo adicional.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicDocument;
