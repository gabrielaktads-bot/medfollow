INSERT INTO storage.buckets (id, name, public) VALUES ('paciente-fotos', 'paciente-fotos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can upload paciente fotos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'paciente-fotos');
CREATE POLICY "Anyone can view paciente fotos" ON storage.objects FOR SELECT USING (bucket_id = 'paciente-fotos');
CREATE POLICY "Authenticated can update paciente fotos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'paciente-fotos');
CREATE POLICY "Authenticated can delete paciente fotos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'paciente-fotos');