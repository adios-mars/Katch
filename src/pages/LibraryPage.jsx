import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase/config'
import { getSavedBooks, updateBookStatus } from '../hooks/useLibrary'
import { BookOpen, Heart, ChevronRight, Droplets, Skull, BookMarked, BookmarkX } from 'lucide-react'

function LibraryPage() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const user = auth.currentUser

  const loadSaved = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    const saved = await getSavedBooks(user.uid)
    setBooks(saved)
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadSaved()
  }, [loadSaved])

  const handleStatusChange = async (bookId, newStatus) => {
    await updateBookStatus(user.uid, bookId, newStatus)
    loadSaved()
  }

  const reading = books.filter(b => b.status === 'reading')
  const wantToRead = books.filter(b => b.status === 'want_to_read')
  const finished = books.filter(b => b.status === 'finished')

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gothic-700 mx-auto mb-4" />
          <p className="text-gray-500 text-xl font-heading">Sign in to see your library</p>
          <button onClick={() => navigate('/login')} className="mt-4 px-6 py-2 bg-blood text-white rounded-xl">Login</button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading your tomes...</div>
  }

  const statusConfig = {
    want_to_read: {
      next: 'reading',
      label: 'Start Reading',
      icon: Droplets,
      color: 'text-blood-light',
      bgHover: 'hover:bg-blood/20'
    },
    reading: {
      next: 'finished',
      label: 'Mark as Finished',
      icon: BookMarked,
      color: 'text-emerald-soft',
      bgHover: 'hover:bg-emerald-900/30'
    },
    finished: {
      next: 'want_to_read',
      label: 'Read Again',
      icon: BookmarkX,
      color: 'text-gray-400',
      bgHover: 'hover:bg-gothic-700'
    }
  }

  const ShelfSection = ({ title, icon: Icon, books, emptyText }) => (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gothic-800/50 rounded-lg border border-gothic-700/50">
            <Icon className="w-5 h-5 text-blood-light" />
          </div>
          <h3 className="text-2xl font-bold text-white font-heading tracking-wide">{title}</h3>
          <span className="text-gray-500 text-sm font-body">({books.length})</span>
        </div>
        {books.length > 4 && (
          <button className="text-gray-400 text-sm hover:text-blood-light transition flex items-center gap-1 font-body">
            Full shelf <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative">
        <div className="flex gap-5 overflow-x-auto pb-6 px-3 pt-2 scrollbar-hide">
          {books.length === 0 ? (
            <div className="w-full py-8 text-center">
              <p className="text-gray-600 italic font-body text-lg">{emptyText}</p>
            </div>
          ) : (
            books.map((book) => {
              const config = statusConfig[book.status] || statusConfig.want_to_read
              const StatusIcon = config.icon

              return (
                <div key={book.book_id} className="flex-shrink-0 group relative">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-b from-blood/0 via-blood/0 to-blood/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                    <div
                      onClick={() => navigate(`/book/${book.book_id}`)}
                      className="relative w-36 cursor-pointer transition-all duration-300 group-hover:-translate-y-3"
                    >
                      <div className="relative">
                        <img
                          src={book.cover || '/bg-login.jpg'}
                          alt={book.title}
                          className="w-full h-52 object-cover rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_25px_rgba(139,21,56,0.3)] transition-all duration-500"
                        />
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-white/10 via-white/5 to-transparent rounded-l" />
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-blood/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b" />
                      </div>
                      <p className="mt-3 text-sm text-gray-300 font-heading line-clamp-2 group-hover:text-blood-light transition-colors">
                        {book.title}
                      </p>
                      <p className="text-xs text-gray-600 font-body italic">{book.author}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange(book.book_id, config.next)
                    }}
                    className={`mt-3 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gothic-900 border border-gothic-700 rounded-lg text-xs font-body transition-all duration-300 ${config.color} ${config.bgHover} hover:border-blood/30 active:scale-95`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {config.label}
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="relative h-4 mx-1">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gothic-600 via-gothic-500 to-gothic-600 rounded-full opacity-60" />
          <div className="absolute top-1 left-0 right-0 h-3 bg-gradient-to-b from-gothic-800 via-gothic-900 to-black rounded-b-lg shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gothic-700/10 to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gothic-600/30" />
          </div>
          <div className="absolute -bottom-2 left-2 right-2 h-4 bg-black/40 blur-md rounded-full" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto bg-gothic-950">
      <div className="mb-12">
        <h2 className="text-5xl font-bold text-white font-heading mb-3 tracking-tight">My Sanctum</h2>
        <p className="text-gray-500 font-body italic text-lg">Where dark tales find their resting place</p>
        <div className="mt-4 w-32 h-px bg-gradient-to-r from-blood/50 via-blood/20 to-transparent" />
      </div>

      <ShelfSection
        title="In My Veins"
        icon={Droplets}
        books={reading}
        emptyText="Nothing flowing through your veins yet..."
      />
      <ShelfSection
        title="Next Victim"
        icon={Skull}
        books={wantToRead}
        emptyText="No victims lined up..."
      />
      <ShelfSection
        title="Buried"
        icon={BookMarked}
        books={finished}
        emptyText="Nothing buried yet..."
      />
    </div>
  )
}

export default LibraryPage
