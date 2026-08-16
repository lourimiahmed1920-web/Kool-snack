import { supabase } from './supabase'
import { toUserMessage } from './errors'

const BUCKET = 'menu-images'
const MAX_BYTES = 5 * 1024 * 1024

/**
 * Uploads a dish photo to the public `menu-images` bucket and returns its public URL,
 * to be stored in `menu_items.image_url`. Writing to this bucket is restricted by
 * storage RLS to inhaber/manager, so this only works from an authenticated admin session.
 */
export async function uploadMenuImage(file: File, menuItemId: string): Promise<{ url: string | null; error: string | null }> {
  if (!file.type.startsWith('image/')) {
    return { url: null, error: 'Bitte eine Bilddatei auswählen.' }
  }
  if (file.size > MAX_BYTES) {
    return { url: null, error: 'Das Bild ist zu groß (max. 5 MB).' }
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${menuItemId}/${Date.now()}.${extension}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  })

  // Storage errors carry bucket names and policy details — log, don't display.
  if (error) {
    return { url: null, error: toUserMessage(error, 'Das Bild konnte nicht hochgeladen werden.') }
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}
