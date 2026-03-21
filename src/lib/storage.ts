import { supabase } from './supabase'

const BUCKET = 'theou-files'

export async function uploadBlob(
  path: string,
  blob: Blob,
  contentType: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType,
      upsert: false,
    })

  if (error) throw new Error(`Upload failed: ${error.message}`)
  return data.path
}

export async function getSignedUrl(
  path: string,
  expiresIn = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn)

  if (error) throw new Error(`Signed URL failed: ${error.message}`)
  return data.signedUrl
}

export function buildStoragePath(
  orgId: string,
  supplierId: string,
  proofId: string,
  filename: string
): string {
  return `org/${orgId}/supplier/${supplierId}/proof/${proofId}/${filename}`
}
