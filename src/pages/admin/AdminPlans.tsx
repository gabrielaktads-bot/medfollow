import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, CreditCard, Pencil, Loader2 } from "lucide-react";
import { usePlanos, type PlanoFormData, type Plano } from "@/hooks/usePlanos";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL, formatNumber } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";


const AdminPlans = () => {
  const { planos, isLoading, createPlano, updatePlano, deletePlano } = usePlanos();
  const emptyForm: PlanoFormData = { nome_do_plano: "", valor_mensal: null, valor_anual: null, limite_agendamentos_mensal: null, numero_de_usuarios: null };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PlanoFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plano | null>(null);
  const [syncingStripe, setSyncingStripe] = useState(false);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: Plano) => {
    setEditingId(p.id);
    setForm({
      nome_do_plano: p.nome_do_plano,
      valor_mensal: p.valor_mensal,
      valor_anual: p.valor_anual,
      limite_agendamentos_mensal: p.limite_agendamentos_mensal,
      numero_de_usuarios: p.numero_de_usuarios,
      stripe_price_id: p.stripe_price_id,
      stripe_product_id: p.stripe_product_id,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome_do_plano) return;

    setSyncingStripe(true);
    try {
      // Create Stripe product and price via edge function
      if (!editingId || !form.stripe_price_id) {
        const valorMensal = form.valor_mensal ?? 0;
        if (valorMensal <= 0) {
          toast({ title: "Valor mensal é obrigatório para criar o produto no Stripe", variant: "destructive" });
          setSyncingStripe(false);
          return;
        }

        const { data: stripeData, error: stripeError } = await supabase.functions.invoke("sync-stripe-plan", {
          body: {
            nome: form.nome_do_plano,
            valor_mensal: valorMensal,
            existingProductId: form.stripe_product_id || null,
          },
        });

        if (stripeError) throw stripeError;
        if (stripeData?.error) throw new Error(stripeData.error);

        form.stripe_product_id = stripeData.product_id;
        form.stripe_price_id = stripeData.price_id;
      }

      if (editingId) {
        updatePlano.mutate({ id: editingId, form }, {
          onSuccess: () => { setOpen(false); setEditingId(null); setForm(emptyForm); },
        });
      } else {
        createPlano.mutate(form, {
          onSuccess: () => { setOpen(false); setForm(emptyForm); },
        });
      }
    } catch (e: any) {
      toast({ title: "Erro ao sincronizar com Stripe", description: e.message, variant: "destructive" });
    } finally {
      setSyncingStripe(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deletePlano.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  const isSaving = createPlano.isPending || updatePlano.isPending || syncingStripe;

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-7 w-40" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gestão de Planos</h2>
        <Button size="sm" onClick={openNew}><Plus className="h-3 w-3 mr-1" /> Novo Plano</Button>
      </div>

      {planos.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center space-y-3">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="font-medium text-muted-foreground">Nenhum plano cadastrado</h3>
          <Button size="sm" onClick={openNew}>+ Novo Plano</Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Mensal</TableHead>
                <TableHead>Agend./Mês</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Stripe</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome_do_plano}</TableCell>
                  <TableCell>{formatBRL(p.valor_mensal)}</TableCell>
                  <TableCell>{formatNumber(p.limite_agendamentos_mensal)}</TableCell>
                  <TableCell>{formatNumber(p.numero_de_usuarios)}</TableCell>
                  <TableCell>
                    {p.stripe_price_id ? (
                      <Badge variant="default" className="text-xs">Sincronizado</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(p)} title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Editar Plano" : "Novo Plano"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome do Plano</Label><Input value={form.nome_do_plano} onChange={(e) => setForm({ ...form, nome_do_plano: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>Valor Mensal (R$) *</Label>
              <Input type="number" value={form.valor_mensal ?? ""} onChange={(e) => setForm({ ...form, valor_mensal: e.target.value === "" ? null : Number(e.target.value) })} className="mt-1" placeholder="0" />
              <p className="text-xs text-muted-foreground mt-1">Este valor será usado para criar a assinatura mensal no Stripe</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Limite Agendamentos/Mês</Label>
                <Input type="number" value={form.limite_agendamentos_mensal ?? ""} onChange={(e) => setForm({ ...form, limite_agendamentos_mensal: e.target.value === "" ? null : Number(e.target.value) })} className="mt-1" placeholder="0" />
              </div>
              <div>
                <Label>Limite Usuários</Label>
                <Input type="number" value={form.numero_de_usuarios ?? ""} onChange={(e) => setForm({ ...form, numero_de_usuarios: e.target.value === "" ? null : Number(e.target.value) })} className="mt-1" placeholder="0" />
              </div>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sincronizando com Stripe...</>
              ) : editingId ? "Salvar alterações" : "Criar Plano"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o plano <strong>"{deleteTarget?.nome_do_plano}"</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deletePlano.isPending}>
              {deletePlano.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPlans;
