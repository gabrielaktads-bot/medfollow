-- Create storage bucket for clinic photos
INSERT INTO storage.buckets (id, name, public) VALUES ('clinica-fotos', 'clinica-fotos', true);

-- Allow authenticated users to upload to clinica-fotos
CREATE POLICY "Authenticated can upload clinica fotos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'clinica-fotos');

-- Allow public to view clinica fotos  
CREATE POLICY "Public can view clinica fotos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'clinica-fotos');

-- Allow authenticated to delete clinica fotos
CREATE POLICY "Authenticated can delete clinica fotos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'clinica-fotos');

-- Allow authenticated to update clinica fotos
CREATE POLICY "Authenticated can update clinica fotos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'clinica-fotos');