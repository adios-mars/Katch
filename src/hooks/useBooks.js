import { supabase } from '../supabase/client'

const TABLE = 'books'

export async function getAllBooks() {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('added_at', { ascending: false })
    
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function addBook(book) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{
      title: book.title,
      author: book.author,
      cover: book.cover,
      pdf_url: book.pdfUrl,
      genre: book.genre,
      description: book.description,
      added_by: 'anonymous'
    }])
    .select()
  
  if (error) throw new Error(error.message || 'Failed to add book')
  return data?.[0] || null
}

export async function searchBooks(searchQuery) {
  if (!searchQuery) return getAllBooks()
  
  const books = await getAllBooks()
  if (!Array.isArray(books)) return []
  
  const lower = searchQuery.toLowerCase()
  return books.filter(b => 
    b.title?.toLowerCase().includes(lower) ||
    b.author?.toLowerCase().includes(lower) ||
    b.genre?.toLowerCase().includes(lower)
  )
}

export async function getBookById(id) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  } catch {
    return null
  }
}

export async function fetchBookCover(title, author) {
  try {
    const query = `${title} ${author}`
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`
    )
    const data = await response.json()
    
    if (data.items && data.items[0]) {
      const cover = data.items[0].volumeInfo?.imageLinks?.thumbnail
      if (cover) {
        return cover.replace('zoom=1', 'zoom=0')
      }
    }
    return null
  } catch {
    return null
  }
}