import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const N8N_WEBHOOK_URL = "https://n8n.srv1525523.hstgr.cloud/webhook/resposta_paciente";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido ou expirado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const { input } = await req.json();
    if (!input || typeof input !== "string") {
      return new Response(JSON.stringify({ error: "Campo 'input' é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find patient cadastro
    const { data: cadastro } = await supabaseAdmin
      .from("cadastros")
      .select("id, clinica_id, nome, sobrenome")
      .eq("user_id", userId)
      .eq("cargo", "paciente")
      .maybeSingle();

    let pacienteId = cadastro?.id;
    let clinicaId = cadastro?.clinica_id;
    const pacienteNome = cadastro?.nome || "Paciente";

    // Resolve clinicaId if missing
    if (pacienteId && !clinicaId) {
      const { data: clinicaData } = await supabaseAdmin
        .from("clinicas")
        .select("id")
        .contains("pacientes", [pacienteId])
        .maybeSingle();
      if (clinicaData) clinicaId = clinicaData.id;
    }

    // Fetch all needed data in parallel
    const [agenteResult, clinicaResult, consultasResult, diagnosticosResult, prontuarioResult, docsResult, arquivosResult] = await Promise.all([
      // Agent config
      clinicaId
        ? supabaseAdmin.from("agente_config").select("nome_agente, orientacoes, palavras_criticas, perguntas_respostas, contato_emergencia, temperatura").eq("clinica_id", clinicaId).maybeSingle()
        : Promise.resolve({ data: null }),
      // Clinic data
      clinicaId
        ? supabaseAdmin.from("clinicas").select("nome_da_clinica, telefone, rua, numero_da_rua, bairro, cidade, estado, cep, horarios_atendimento").eq("id", clinicaId).maybeSingle()
        : Promise.resolve({ data: null }),
      // Next appointments (future)
      pacienteId
        ? supabaseAdmin.from("agendamentos").select("data_do_agendamento, hora, medico_id").eq("paciente_id", pacienteId).gte("data_do_agendamento", new Date().toISOString().split("T")[0]).order("data_do_agendamento", { ascending: true }).limit(3)
        : Promise.resolve({ data: [] }),
      // Diagnosticos
      pacienteId
        ? supabaseAdmin.from("diagnosticos").select("ultima_avaliacao_resumo, receita_passada, data").eq("paciente_id", pacienteId).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      // Prontuario entries (procedures/protocols accessible to patient)
      pacienteId
        ? supabaseAdmin.from("prontuario_entradas").select("tipo, titulo, conteudo, created_at").eq("paciente_id", pacienteId).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      // Shared documents
      pacienteId
        ? supabaseAdmin.from("documentos_compartilhados").select("tipo, titulo, conteudo, link_token, created_at").eq("paciente_id", pacienteId).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      // Shared files
      pacienteId
        ? supabaseAdmin.from("arquivos_paciente").select("nome_arquivo, url, tipo, descricao").eq("paciente_id", pacienteId).eq("compartilhado_com_paciente", true)
        : Promise.resolve({ data: [] }),
    ]);

    const agenteConfig = agenteResult.data;
    const clinicaData = clinicaResult.data;
    const consultas = consultasResult.data || [];
    const diagnosticos = diagnosticosResult.data || [];
    const prontuarioEntradas = prontuarioResult.data || [];
    const docs = docsResult.data || [];
    const arquivos = arquivosResult.data || [];

    // Save user message
    if (pacienteId) {
      await supabaseAdmin.from("mensagens_chat").insert({
        clinica_id: clinicaId || null,
        paciente_id: pacienteId,
        role: "user",
        conteudo: input,
      });
    }

    // Critical words check & notifications
    if (pacienteId && clinicaId && agenteConfig?.palavras_criticas?.length) {
      const inputLower = input.toLowerCase();
      const matchedWords = agenteConfig.palavras_criticas.filter((w: string) => inputLower.includes(w.toLowerCase()));
      if (matchedWords.length > 0) {
        const { data: medicos } = await supabaseAdmin
          .from("cadastros").select("id, user_id").eq("clinica_id", clinicaId).eq("cargo", "medico").eq("ativo", true);
        if (medicos?.length) {
          // One notification per critical-word event (not per doctor)
          await supabaseAdmin.from("notificacoes").insert({
            tipo: "palavra_critica",
            conteudo: `Paciente usou palavra(s) crítica(s): ${matchedWords.join(", ")}. Mensagem: "${input.substring(0, 200)}"`,
            paciente_id: pacienteId,
            medico_id: null,
            prioridade: "alta",
            urgencia: "alta",
            status: "pendente",
            vista: false,
          });

          // Send email alerts via Resend to each doctor
          const resendApiKey = Deno.env.get("RESEND_API_KEY");
          if (resendApiKey) {
            const userIds = medicos
              .map((m: { id: string; user_id: string | null }) => m.user_id)
              .filter(Boolean) as string[];
            for (const uid of userIds) {
              try {
                const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(uid);
                const doctorEmail = authUser?.user?.email;
                if (!doctorEmail) continue;
                const resendRes = await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${resendApiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    from: "MedFollow <onboarding@resend.dev>",
                    to: [doctorEmail],
                    subject: `⚠️ Alerta: paciente ${pacienteNome} usou palavra(s) crítica(s)`,
                    html: `
                      <h2 style="color:#c0392b;">Alerta de Monitoramento — MedFollow</h2>
                      <p>O paciente <strong>${pacienteNome}</strong> enviou uma mensagem contendo palavra(s) que requerem atenção:</p>
                      <table style="border-collapse:collapse;width:100%;max-width:600px;">
                        <tr><td style="padding:8px;font-weight:bold;width:180px;">Palavras detectadas:</td><td style="padding:8px;">${matchedWords.join(", ")}</td></tr>
                        <tr style="background:#f9f9f9;"><td style="padding:8px;font-weight:bold;">Mensagem:</td><td style="padding:8px;">"${input.substring(0, 500)}"</td></tr>
                      </table>
                      <p style="margin-top:16px;">Acesse o sistema para verificar o histórico completo do paciente e tomar as medidas necessárias.</p>
                      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
                      <p style="color:#888;font-size:12px;">MedFollow — Sistema de Acompanhamento de Pacientes</p>
                    `,
                  }),
                });
                if (!resendRes.ok) {
                  const errBody = await resendRes.text();
                  console.error("Resend API error for", doctorEmail, resendRes.status, errBody);
                } else {
                  console.log("Resend email sent to", doctorEmail);
                }
              } catch (emailErr) {
                console.error("Resend email exception for uid", uid, emailErr);
              }
            }
          } else {
            console.warn("RESEND_API_KEY not set — skipping email alerts");
          }
        }
      }
    }

    // Build clinic info string
    let dadosClinica = "";
    if (clinicaData) {
      const parts = [
        clinicaData.nome_da_clinica && `Nome: ${clinicaData.nome_da_clinica}`,
        clinicaData.telefone && `Telefone: ${clinicaData.telefone}`,
      ];
      const endParts = [clinicaData.rua, clinicaData.numero_da_rua, clinicaData.bairro, clinicaData.cidade, clinicaData.estado, clinicaData.cep].filter(Boolean);
      if (endParts.length) parts.push(`Endereço: ${endParts.join(", ")}`);
      if (clinicaData.horarios_atendimento) {
        try {
          const horarios = typeof clinicaData.horarios_atendimento === "string"
            ? JSON.parse(clinicaData.horarios_atendimento)
            : clinicaData.horarios_atendimento;
          const ativos = horarios.filter((h: { ativo: boolean }) => h.ativo);
          if (ativos.length) {
            parts.push("Horários: " + ativos.map((h: { dia: string; inicio: string; fim: string }) => `${h.dia} ${h.inicio}-${h.fim}`).join(", "));
          }
        } catch { /* ignore */ }
      }
      dadosClinica = parts.filter(Boolean).join(" | ");
    }

    // Build next appointment string
    let proximaConsulta = "Nenhuma consulta futura agendada";
    if (consultas.length > 0) {
      // Fetch doctor names for appointments
      const medicoIds = [...new Set(consultas.map((c: { medico_id: string | null }) => c.medico_id).filter(Boolean))];
      let medicoMap: Record<string, string> = {};
      if (medicoIds.length) {
        const { data: medData } = await supabaseAdmin.from("cadastros").select("id, nome, sobrenome").in("id", medicoIds);
        if (medData) {
          medicoMap = Object.fromEntries(medData.map((m: { id: string; nome: string; sobrenome: string | null }) => [m.id, [m.nome, m.sobrenome].filter(Boolean).join(" ")]));
        }
      }
      proximaConsulta = consultas.map((c: { data_do_agendamento: string | null; hora: string | null; medico_id: string | null }) => {
        const parts = [];
        if (c.data_do_agendamento) parts.push(`Data: ${c.data_do_agendamento}`);
        if (c.hora) parts.push(`Horário: ${c.hora}`);
        if (c.medico_id && medicoMap[c.medico_id]) parts.push(`Médico: ${medicoMap[c.medico_id]}`);
        return parts.join(", ");
      }).join(" | ");
    }

    // Build diagnostics + links string
    let diagnosticosStr = "";
    const diagParts: string[] = [];
    diagnosticos.forEach((d: { ultima_avaliacao_resumo: string | null; receita_passada: string | null; data: string | null }) => {
      const p = [];
      if (d.data) p.push(`Data: ${d.data}`);
      if (d.ultima_avaliacao_resumo) p.push(`Avaliação: ${d.ultima_avaliacao_resumo}`);
      if (d.receita_passada) p.push(`Receita: ${d.receita_passada}`);
      if (p.length) diagParts.push(p.join(", "));
    });
    // Add shared docs/files links
    docs.forEach((d: { titulo: string; tipo: string; link_token: string | null }) => {
      if (d.link_token) {
        diagParts.push(`${d.tipo} - ${d.titulo}: ${supabaseUrl.replace('/rest/v1', '').replace('https://', `https://${Deno.env.get('SUPABASE_URL')?.includes('supabase') ? '' : ''}`)}/doc/${d.link_token}`);
      }
    });
    arquivos.forEach((a: { nome_arquivo: string; url: string; descricao: string | null }) => {
      diagParts.push(`Arquivo: ${a.nome_arquivo}${a.descricao ? ` (${a.descricao})` : ''} - ${a.url}`);
    });
    diagnosticosStr = diagParts.length ? diagParts.join(" | ") : "Nenhum diagnóstico registrado";

    // Build protocols string (prontuario entries of type procedimento/protocolo)
    const protocolos = prontuarioEntradas
      .filter((e: { tipo: string }) => ["procedimento", "protocolo", "receita"].includes(e.tipo))
      .map((e: { tipo: string; titulo: string; conteudo: string }) => `${e.tipo}: ${e.titulo} - ${e.conteudo.substring(0, 300)}`)
      .join(" | ") || "Nenhum protocolo registrado";

    // Format Q&A
    let qaFormatted: unknown = [];
    if (agenteConfig?.perguntas_respostas) {
      const qa = agenteConfig.perguntas_respostas;
      if (Array.isArray(qa)) {
        qaFormatted = qa.map((item: { pergunta?: string; resposta?: string }) =>
          `Pergunta: ${item.pergunta || ""} | Resposta: ${item.resposta || ""}`
        ).join("\n");
      } else {
        qaFormatted = qa;
      }
    }

    // Call n8n webhook with user's access token
    const userAccessToken = token;
    console.log("patient-chat: calling n8n webhook with enriched payload...");
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input,
        nome: agenteConfig?.nome_agente || "Assistente de Saúde",
        instrucoes: agenteConfig?.orientacoes || "",
        paciente: pacienteNome,
        "q&a": qaFormatted,
        emergencia: agenteConfig?.contato_emergencia || "",
        "dados-da-clinica": dadosClinica,
        "proxima-consulta": proximaConsulta,
        "diagnosticos": diagnosticosStr,
        "protocolos": protocolos,
        "temperature": Number(agenteConfig?.temperatura ?? 0.7),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("n8n webhook error:", response.status, text);
      return new Response(JSON.stringify({ error: "Erro ao processar sua mensagem." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawText = await response.text();
    let assistantContent: string;
    try {
      const data = JSON.parse(rawText);
      assistantContent = data.output || data.content || data.response || JSON.stringify(data);
    } catch {
      // n8n returned plain text instead of JSON
      assistantContent = rawText || "Sem resposta do assistente.";
    }

    // Save assistant message
    if (pacienteId) {
      await supabaseAdmin.from("mensagens_chat").insert({
        clinica_id: clinicaId || null,
        paciente_id: pacienteId,
        role: "assistant",
        conteudo: assistantContent,
      });
    }

    return new Response(JSON.stringify({ content: assistantContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("patient-chat error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
