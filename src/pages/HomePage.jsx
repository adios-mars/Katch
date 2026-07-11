import { useState, useEffect, useCallback } from 'react'
import { getAllBooks, searchBooks } from '../hooks/useBooks'
import { Search, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SkeletonGrid, EmptyState } from '../components/LoadingComponents'

function HomePage() {
  const [query, setQuery] = useState('')
  const [books, setBooks] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const genres = ['all', 'Fantasy', 'Dark Romance', 'Soft Romance', 'Horror', 'Sci-Fi', 'Mystery', 'Thriller', 'Non-Fiction']

  const loadBooks = useCallback(async () => {
    setLoading(true)
    const allBooks = await getAllBooks()
    setBooks(allBooks || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    if (!query.trim()) {
      const allBooks = await getAllBooks()
      setBooks(allBooks || [])
    } else {
      const results = await searchBooks(query)
      setBooks(results || [])
    }
    setLoading(false)
  }

  const filterByGenre = async (genre) => {
    setSelectedGenre(genre)
    setLoading(true)
    if (genre === 'all') {
      const allBooks = await getAllBooks()
      setBooks(allBooks || [])
    } else {
      const allBooks = await getAllBooks()
      const filtered = allBooks.filter(b => b.genre === genre)
      setBooks(filtered || [])
    }
    setLoading(false)
  }

  return (
    <div>
      {/* Hero - Mobile Responsive */}
      <div className="relative h-[250px] sm:h-[300px] md:h-[350px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center scale-100" style={{ backgroundImage: 'url(/bg-hero.jpg)' }} />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1.3px]" />

        <div className="relative z-10 text-center px-4 sm:px-8 max-w-2xl">
          <p className="text-blood-glow font-heading italic text-sm sm:text-xl mb-2 tracking-wide">Step where the heart glows.....</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading italic text-gray font-heading mb-4 drop-shadow-2xl">The Library of Lost Hearts</h1>
          <p className="text-base sm:text-xl text-gray mb-6 sm:mb-8 font-body italic leading-relaxed">No force on earth shall part what love hath joined.</p>

          <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search titles, authors, obsessions...."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-24 sm:pr-28 py-3 sm:py-4 bg-black/30 backdrop-blur-md border border-white/10 rounded-3xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blood/50 font-body text-sm sm:text-lg"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 sm:px-6 py-2 bg-blood/90 text-white rounded-xl hover:bg-blood-light transition font-medium text-sm sm:text-base">Search</button>
          </form>
        </div>
      </div>

      <div className="p-2 sm:p-4 max-w-6xl mx-auto">
        {/* Genre Filters - Horizontal Scroll on Mobile */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => filterByGenre(genre)}
              className={`px-4 sm:px-7 py-2 rounded-full text-xs sm:text-sm transition font-body tracking-wide whitespace-nowrap shrink-0 ${selectedGenre === genre ? 'bg-blood text-white shadow-[0_0_15px_rgba(139,21,56,0.4)]' : 'bg-gothic-800 text-gray-400 hover:bg-gothic-700 border border-gothic-700 hover:border-blood/30'}`}
            >
              {genre === 'all' ? 'All Books' : genre}
            </button>
          ))}
        </div>

        {/* SKELETON LOADER instead of "Loading..." text */}
        {loading && <SkeletonGrid count={8} />}

        {/* Empty State */}
        {!loading && (!Array.isArray(books) || books.length === 0) ? (
          <EmptyState
            icon={BookOpen}
            title="The library is empty..."
            description="Be the first to add a dark tale to the collection."
            action={
              <button
                onClick={() => navigate('/add-book')}
                className="mt-6 px-8 py-3 bg-blood text-white rounded-full hover:bg-blood-light transition font-medium shadow-[0_0_20px_rgba(139,21,56,0.3)]"
              >
                Add Book
              </button>
            }
          />
        ) : (
          /* Mobile Responsive Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                onClick={() => navigate(`/book/${book.id}`)}
                className="bg-gothic-900 rounded-2xl p-3 sm:p-4 border border-gothic-800 hover:border-blood/40 transition cursor-pointer group"
              >
                <div className="overflow-hidden rounded-xl mb-3">
                  <img
                    src={book.cover || '/bg-login.jpg'}
                    alt={book.title}
                    className="w-full h-48 sm:h-56 md:h-64 object-cover group-hover:scale-105 transition duration-700"
                  />
                </div>
                <span className="inline-block px-2 py-1 bg-blood/20 text-blood-glow rounded-full text-[10px] sm:text-xs mb-2 font-medium tracking-wide">
                  {book.genre}
                </span>
                <h3 className="font-semibold text-gray-200 line-clamp-2 group-hover:text-blood-light transition font-heading text-sm sm:text-base">
                  {book.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 font-body italic">{book.author}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage
