import { supabase } from '../supabase/client'

const TABLE = 'saves'

export async function saveBook(userId, bookId, bookData) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{
      user_id: userId,
      book_id: bookId,
      title: bookData.title,
      author: bookData.author,
      cover: bookData.cover,
      genre: bookData.genre,
      status: 'want_to_read',
      saved_at: new Date().toISOString()
    }])
    .select()

  if (error) throw new Error(error.message || 'Failed to save book')
  return data
}

export async function unsaveBook(userId, bookId) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('book_id', bookId)

  if (error) throw new Error(error.message || 'Failed to unsave book')
}

export async function isBookSaved(userId, bookId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found, not a real error
    return false
  }
  return !!data
}

export async function getSavedBooks(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function updateBookStatus(userId, bookId, status) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status })
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .select()

  if (error) throw new Error(error.message || 'Failed to update status')
  return data
}

export async function getSavedBooksByStatus(userId, status) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('status', status)
    .order('saved_at', { ascending: false })

  if (error) return []
  return data || []
}
