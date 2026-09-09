import { supabase } from '../lib/supabase';

export async function uploadMaintenanceDocument(params: {
  entityType: string;
  entityId: string;
  fileName: string;
  uri: string;
  mimeType?: string | null;
}) {
  const response = await fetch(params.uri);
  const body = await response.arrayBuffer();
  const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]+/g, '_');
  const path = `${params.entityType}/${params.entityId}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from('maintenance-documents').upload(path, body, { contentType: params.mimeType ?? 'application/octet-stream' });
  if (uploadError) throw uploadError;
  const { data: userData } = await supabase.auth.getUser();
  const { error: dbError } = await supabase.from('documents').insert({ entity_type: params.entityType, entity_id: params.entityId, document_type: params.mimeType ?? null, file_name: params.fileName, storage_path: path, uploaded_by: userData.user?.id ?? null });
  if (dbError) throw dbError;
  return path;
}

export async function listMaintenanceDocuments(entityType: string, entityId: string) {
  const { data, error } = await supabase.from('documents').select('id,file_name,document_type,storage_path,created_at').eq('entity_type', entityType).eq('entity_id', entityId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getDocumentSignedUrl(path: string) {
  const { data, error } = await supabase.storage.from('maintenance-documents').createSignedUrl(path, 600);
  if (error) throw error;
  return data.signedUrl;
}
