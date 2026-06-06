export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          clinica_id: string | null
          created_at: string
          data: string | null
          data_do_agendamento: string | null
          hora: string | null
          id: string
          informacoes_adicionais: string | null
          medico_id: string | null
          paciente_id: string | null
          updated_at: string
        }
        Insert: {
          clinica_id?: string | null
          created_at?: string
          data?: string | null
          data_do_agendamento?: string | null
          hora?: string | null
          id?: string
          informacoes_adicionais?: string | null
          medico_id?: string | null
          paciente_id?: string | null
          updated_at?: string
        }
        Update: {
          clinica_id?: string | null
          created_at?: string
          data?: string | null
          data_do_agendamento?: string | null
          hora?: string | null
          id?: string
          informacoes_adicionais?: string | null
          medico_id?: string | null
          paciente_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_config: {
        Row: {
          clinica_id: string
          contato_emergencia: string | null
          created_at: string
          id: string
          nome_agente: string
          orientacoes: string | null
          palavras_criticas: string[]
          perguntas_respostas: Json
          temperatura: number
          updated_at: string
        }
        Insert: {
          clinica_id: string
          contato_emergencia?: string | null
          created_at?: string
          id?: string
          nome_agente?: string
          orientacoes?: string | null
          palavras_criticas?: string[]
          perguntas_respostas?: Json
          temperatura?: number
          updated_at?: string
        }
        Update: {
          clinica_id?: string
          contato_emergencia?: string | null
          created_at?: string
          id?: string
          nome_agente?: string
          orientacoes?: string | null
          palavras_criticas?: string[]
          perguntas_respostas?: Json
          temperatura?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agente_config_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: true
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      arquivos_paciente: {
        Row: {
          clinica_id: string | null
          compartilhado_com_paciente: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          medico_id: string | null
          nome_arquivo: string
          paciente_id: string
          tipo: string | null
          url: string
        }
        Insert: {
          clinica_id?: string | null
          compartilhado_com_paciente?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          medico_id?: string | null
          nome_arquivo: string
          paciente_id: string
          tipo?: string | null
          url: string
        }
        Update: {
          clinica_id?: string | null
          compartilhado_com_paciente?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          medico_id?: string | null
          nome_arquivo?: string
          paciente_id?: string
          tipo?: string | null
          url?: string
        }
        Relationships: []
      }
      cadastros: {
        Row: {
          ativo: boolean
          bairro: string | null
          cargo: string | null
          cep: string | null
          cidade: string | null
          clinica_id: string | null
          complemento: string | null
          conselho: string | null
          created_at: string
          data_de_nascimento: string | null
          diagnosticos: string[] | null
          especialidades: string | null
          estado: string | null
          foto: string | null
          genero: string | null
          id: string
          informacoes_adicionais: string | null
          medicos: string[] | null
          nome: string
          notificacoes: string[] | null
          numero_da_rua: string | null
          pacientes: string[] | null
          rua: string | null
          sobrenome: string | null
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          clinica_id?: string | null
          complemento?: string | null
          conselho?: string | null
          created_at?: string
          data_de_nascimento?: string | null
          diagnosticos?: string[] | null
          especialidades?: string | null
          estado?: string | null
          foto?: string | null
          genero?: string | null
          id?: string
          informacoes_adicionais?: string | null
          medicos?: string[] | null
          nome: string
          notificacoes?: string[] | null
          numero_da_rua?: string | null
          pacientes?: string[] | null
          rua?: string | null
          sobrenome?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          clinica_id?: string | null
          complemento?: string | null
          conselho?: string | null
          created_at?: string
          data_de_nascimento?: string | null
          diagnosticos?: string[] | null
          especialidades?: string | null
          estado?: string | null
          foto?: string | null
          genero?: string | null
          id?: string
          informacoes_adicionais?: string | null
          medicos?: string[] | null
          nome?: string
          notificacoes?: string[] | null
          numero_da_rua?: string | null
          pacientes?: string[] | null
          rua?: string | null
          sobrenome?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cadastros_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      clinicas: {
        Row: {
          ativa: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          conselho_responsavel: string | null
          created_at: string
          email_da_clinica: string | null
          estado: string | null
          foto: string | null
          funcionarios: string[] | null
          horarios_atendimento: Json | null
          id: string
          informacoes_adicionais: string | null
          medicos: string[] | null
          nome_da_clinica: string
          nome_do_responsavel: string | null
          notificacoes: string[] | null
          numero_da_rua: string | null
          pacientes: string[] | null
          plano_id: string | null
          rua: string | null
          telefone: string | null
          updated_at: string
          user_responsavel: string | null
        }
        Insert: {
          ativa?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          conselho_responsavel?: string | null
          created_at?: string
          email_da_clinica?: string | null
          estado?: string | null
          foto?: string | null
          funcionarios?: string[] | null
          horarios_atendimento?: Json | null
          id?: string
          informacoes_adicionais?: string | null
          medicos?: string[] | null
          nome_da_clinica: string
          nome_do_responsavel?: string | null
          notificacoes?: string[] | null
          numero_da_rua?: string | null
          pacientes?: string[] | null
          plano_id?: string | null
          rua?: string | null
          telefone?: string | null
          updated_at?: string
          user_responsavel?: string | null
        }
        Update: {
          ativa?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          conselho_responsavel?: string | null
          created_at?: string
          email_da_clinica?: string | null
          estado?: string | null
          foto?: string | null
          funcionarios?: string[] | null
          horarios_atendimento?: Json | null
          id?: string
          informacoes_adicionais?: string | null
          medicos?: string[] | null
          nome_da_clinica?: string
          nome_do_responsavel?: string | null
          notificacoes?: string[] | null
          numero_da_rua?: string | null
          pacientes?: string[] | null
          plano_id?: string | null
          rua?: string | null
          telefone?: string | null
          updated_at?: string
          user_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinicas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosticos: {
        Row: {
          clinica_id: string | null
          created_at: string
          data: string | null
          id: string
          medico_id: string | null
          paciente_id: string | null
          receita_passada: string | null
          ultima_avaliacao_completo: string | null
          ultima_avaliacao_resumo: string | null
          updated_at: string
        }
        Insert: {
          clinica_id?: string | null
          created_at?: string
          data?: string | null
          id?: string
          medico_id?: string | null
          paciente_id?: string | null
          receita_passada?: string | null
          ultima_avaliacao_completo?: string | null
          ultima_avaliacao_resumo?: string | null
          updated_at?: string
        }
        Update: {
          clinica_id?: string | null
          created_at?: string
          data?: string | null
          id?: string
          medico_id?: string | null
          paciente_id?: string | null
          receita_passada?: string | null
          ultima_avaliacao_completo?: string | null
          ultima_avaliacao_resumo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnosticos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosticos_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosticos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_compartilhados: {
        Row: {
          clinica_id: string | null
          conteudo: string | null
          created_at: string | null
          id: string
          link_token: string | null
          medico_id: string | null
          paciente_id: string
          referencia_id: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          clinica_id?: string | null
          conteudo?: string | null
          created_at?: string | null
          id?: string
          link_token?: string | null
          medico_id?: string | null
          paciente_id: string
          referencia_id?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          clinica_id?: string | null
          conteudo?: string | null
          created_at?: string | null
          id?: string
          link_token?: string | null
          medico_id?: string | null
          paciente_id?: string
          referencia_id?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      fluxos: {
        Row: {
          clinica_id: string | null
          created_at: string
          descricao: string | null
          id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          clinica_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          clinica_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fluxos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_chat: {
        Row: {
          clinica_id: string | null
          conteudo: string
          created_at: string
          id: string
          paciente_id: string
          role: string
        }
        Insert: {
          clinica_id?: string | null
          conteudo: string
          created_at?: string
          id?: string
          paciente_id: string
          role: string
        }
        Update: {
          clinica_id?: string | null
          conteudo?: string
          created_at?: string
          id?: string
          paciente_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_chat_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_chat_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          conteudo: string | null
          created_at: string
          data_de_criacao: string
          id: string
          medico_id: string | null
          paciente_id: string | null
          prioridade: string | null
          status: string | null
          tipo: string | null
          urgencia: string | null
          vista: boolean
        }
        Insert: {
          conteudo?: string | null
          created_at?: string
          data_de_criacao?: string
          id?: string
          medico_id?: string | null
          paciente_id?: string | null
          prioridade?: string | null
          status?: string | null
          tipo?: string | null
          urgencia?: string | null
          vista?: boolean
        }
        Update: {
          conteudo?: string | null
          created_at?: string
          data_de_criacao?: string
          id?: string
          medico_id?: string | null
          paciente_id?: string | null
          prioridade?: string | null
          status?: string | null
          tipo?: string | null
          urgencia?: string | null
          vista?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          limite_agendamentos_mensal: number | null
          nome_do_plano: string
          numero_de_usuarios: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
          valor_anual: number | null
          valor_mensal: number | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          limite_agendamentos_mensal?: number | null
          nome_do_plano: string
          numero_de_usuarios?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
          valor_anual?: number | null
          valor_mensal?: number | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          limite_agendamentos_mensal?: number | null
          nome_do_plano?: string
          numero_de_usuarios?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
          valor_anual?: number | null
          valor_mensal?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string | null
          ultimo_cadastro_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          ultimo_cadastro_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          ultimo_cadastro_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_ultimo_cadastro_id_fkey"
            columns: ["ultimo_cadastro_id"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
        ]
      }
      prontuario_entradas: {
        Row: {
          clinica_id: string | null
          conteudo: string
          created_at: string
          id: string
          medico_id: string | null
          paciente_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          clinica_id?: string | null
          conteudo: string
          created_at?: string
          id?: string
          medico_id?: string | null
          paciente_id: string
          tipo?: string
          titulo: string
        }
        Update: {
          clinica_id?: string | null
          conteudo?: string
          created_at?: string
          id?: string
          medico_id?: string | null
          paciente_id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "prontuario_entradas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuario_entradas_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuario_entradas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_clinica_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_paciente_ids: { Args: { _user_id: string }; Returns: string[] }
      has_cargo: {
        Args: { _cargo: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
