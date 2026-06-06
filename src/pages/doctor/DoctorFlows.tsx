import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useFluxos, type FluxoFormData } from "@/hooks/useFluxos";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DoctorFlows = () => {
  const { fluxos, isLoading, createFluxo, deleteFluxo } = useFluxos();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FluxoFormData>({ titulo: "", descricao: "" });

  const handleCreate = () => {
    if (!form.titulo) return;
    createFluxo.mutate(form, { onSuccess: () => { setOpen(false); setForm({ titulo: "", descricao: "" }); } });
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-7 w-48" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fluxos de Acompanhamento</h2>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3 w-3 mr-1" /> Novo Fluxo</Button>
      </div>

      {fluxos.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center space-y-3">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="font-medium text-muted-foreground">Nenhum fluxo cadastrado</h3>
          <Button size="sm" onClick={() => setOpen(true)}>+ Novo Fluxo</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fluxos.map((f) => (
            <div key={f.id} className="rounded-lg border bg-card p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> {f.titulo}
              </h3>
              <p className="text-sm text-muted-foreground">{f.descricao || "Sem descrição"}</p>
              <Button variant="outline" size="sm" onClick={() => deleteFluxo.mutate(f.id)}>
                <Trash2 className="h-3 w-3 mr-1" /> Remover
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Fluxo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="mt-1" /></div>
            <div><Label>Descrição</Label><Textarea value={form.descricao || ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-1" /></div>
            <Button onClick={handleCreate} disabled={createFluxo.isPending} className="w-full">{createFluxo.isPending ? "Criando..." : "Criar Fluxo"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorFlows;
