import { useState } from 'react'
import { addBook, fetchBookCover } from '../hooks/useBooks'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Link, Image, Search } from 'lucide-react'

function AddBookPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    author: '',
    cover: '',
    pdfUrl: '',
    genre: 'Dark Romance',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [fetchingCover, setFetchingCover] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const genres = ['Dark Romance', 'Fantasy', 'Romance', 'Horror', 'Sci-Fi', 'Mystery', 'Thriller', 'Non-Fiction', 'Other']

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFetchCover = async () => {
    if (!form.title || !form.author) {
      setError('Please enter title and author first')
      return
    }

    setFetchingCover(true)
    setError(null)
    const cover = await fetchBookCover(form.title, form.author)
    setFetchingCover(false)

    if (cover) {
      setForm({ ...form, cover })
    } else {
      setError('No cover found. You can paste a cover URL manually.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.author || !form.pdfUrl) {
      setError('Please fill in title, author, and PDF link')
      return
    }

    let pdfUrl = form.pdfUrl
    if (pdfUrl.includes('drive.google.com/file/d/')) {
      const fileId = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]
      if (fileId) {
        pdfUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
      }
    }

    setLoading(true)
    setError(null)
    try {
      await addBook({...form, pdfUrl})
      setSubmitted(true)
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      setError('Failed to add book: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gothic-950">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-blood mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white font-heading">Book Added!</h2>
          <p className="text-gray-400 mt-2 font-body italic">Redirecting to library...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto bg-gothic-950">
      <h1 className="text-3xl font-bold text-white mb-2 font-heading">Add a Book</h1>
      <p className="text-gray-400 mb-8 font-body italic">Share a dark tale with the community</p>

      {error && (
        <div className="bg-red-900/60 border border-red-700/50 px-4 py-3 rounded-xl mb-6 text-red-200 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-white">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 font-body">Book Title *</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. A Court of Thorns and Roses"
            className="w-full px-4 py-3 bg-gothic-900 border border-gothic-700 rounded-2xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blood/50 font-body"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 font-body">Author *</label>
          <input
            name="author"
            value={form.author}
            onChange={handleChange}
            placeholder="e.g. Sarah J. Maas"
            className="w-full px-4 py-3 bg-gothic-900 border border-gothic-700 rounded-2xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blood/50 font-body"
            required
          />
        </div>

        <div>
          <button
            type="button"
            onClick={handleFetchCover}
            disabled={fetchingCover}
            className="flex items-center gap-2 px-4 py-2 bg-gothic-800 text-gray-300 rounded-xl hover:bg-gothic-700 transition font-body text-sm disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {fetchingCover ? 'Searching...' : 'Auto-fetch cover from Google Books'}
          </button>
        </div>

        {form.cover && (
          <div className="flex items-center gap-4">
            <div className="w-24 h-36 rounded-xl overflow-hidden border border-gothic-700">
              <img src={form.cover} alt="Cover preview" className="w-full h-full object-cover" />
            </div>
            <p className="text-gray-400 text-sm font-body">Cover found!</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 font-body">Or paste cover URL</label>
          <div className="relative">
            <Image className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              name="cover"
              value={form.cover}
              onChange={handleChange}
              placeholder="https://example.com/cover.jpg"
              className="w-full pl-12 pr-4 py-3 bg-gothic-900 border border-gothic-700 rounded-2xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blood/50 font-body"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 font-body">Genre</label>
          <select
            name="genre"
            value={form.genre}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gothic-900 border border-gothic-700 rounded-2xl text-gray-200 focus:outline-none focus:border-blood/50 font-body"
          >
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 font-body">PDF Link *</label>
          <div className="relative">
            <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              name="pdfUrl"
              value={form.pdfUrl}
              onChange={handleChange}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full pl-12 pr-4 py-3 bg-gothic-900 border border-gothic-700 rounded-2xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blood/50 font-body"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 font-body">Google Drive links auto-convert. Use Drive for best results.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1 font-body">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="What is this dark tale about?"
            rows={4}
            className="w-full px-4 py-3 bg-gothic-900 border border-gothic-700 rounded-2xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blood/50 font-body resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-blood text-white font-medium rounded-2xl hover:bg-blood-light transition disabled:opacity-50 font-heading tracking-wide shadow-[0_0_20px_rgba(139,21,56,0.3)]"
        >
          {loading ? 'Adding...' : 'Add to Library'}
        </button>
      </form>
    </div>
  )
}

export default AddBookPage
