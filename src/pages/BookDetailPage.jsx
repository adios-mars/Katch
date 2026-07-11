import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { getBookById } from '../hooks/useBooks'
import { saveBook, unsaveBook, isBookSaved } from '../hooks/useLibrary'
import { getGroupsByBook, createGroup, joinGroup, isGroupMember } from '../hooks/useGroups'
import { auth } from '../firebase/config'
import { ArrowLeft, BookOpen, Heart, MessageCircle } from 'lucide-react'
import { SkeletonBookDetail } from '../components/LoadingComponents'

function BookDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [groupId, setGroupId] = useState(null)
  const [isMember, setIsMember] = useState(false)
  const [error, setError] = useState(null)
  const user = auth.currentUser

  const fetchBook = useCallback(async () => {
    const data = await getBookById(id)
    setBook(data)
    setLoading(false)

    if (user && data) {
      const saved = await isBookSaved(user.uid, id)
      setIsSaved(saved)
    }

    const groups = await getGroupsByBook(id)
    if (groups.length > 0) {
      setGroupId(groups[0].id)
      if (user) {
        const member = await isGroupMember(groups[0].id, user.uid)
        setIsMember(member)
      }
    }
  }, [id, user])

  useEffect(() => {
    fetchBook()
  }, [fetchBook])

  const handleSave = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!book) return

    setSaveLoading(true)
    setError(null)
    try {
      if (isSaved) {
        await unsaveBook(user.uid, id)
        setIsSaved(false)
      } else {
        await saveBook(user.uid, id, book)
        setIsSaved(true)
      }
    } catch (err) {
      setError(err.message || 'Failed to save book')
    }
    setSaveLoading(false)
  }

  const handleDiscuss = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    let currentGroupId = groupId

    if (!currentGroupId) {
      try {
        const newGroup = await createGroup({
          name: `${book.title} Discussion`,
          bookId: id,
          bookTitle: book.title,
          createdBy: user.uid
        })
        currentGroupId = newGroup.id
        setGroupId(newGroup.id)
      } catch (err) {
        setError(err.message || 'Failed to create group')
        return
      }
    }

    if (!isMember) {
      try {
        await joinGroup(currentGroupId, user.uid)
        setIsMember(true)
      } catch (err) {
        setError(err.message || 'Failed to join group')
        return
      }
    }

    navigate(`/group/${currentGroupId}`)
  }

  const handleReadPDF = () => {
    if (!book?.pdf_url) return
    const match = book.pdf_url.match(/\/d\/([a-zA-Z0-9_-]+)/)
    const fileId = match?.[1]
    if (fileId) {
      window.open(`https://drive.google.com/file/d/${fileId}/preview`, '_blank')
    } else {
      window.open(book.pdf_url, '_blank')
    }
  }

  if (loading) return <SkeletonBookDetail />

  if (!book) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 text-lg">Book not found</p>
        <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-blood text-white rounded-xl">Go Home</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto bg-gothic-950">
      {error && (
        <div className="bg-red-900/80 border border-red-700/50 px-4 py-3 rounded-xl mb-6 text-red-200 text-sm text-center">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-white">✕</button>
        </div>
      )}

      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-blood-light mb-6 transition">
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
        <div className="w-full md:w-1/3">
          <img src={book.cover || '/bg-login.jpg'} alt={book.title} className="w-full rounded-2xl shadow-lg" />
        </div>

        <div className="flex-1">
          <span className="inline-block px-3 py-1 bg-blood/20 text-blood-light rounded-full text-sm mb-3">{book.genre}</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading">{book.title}</h1>
          <p className="text-base sm:text-lg text-gray-400 mt-2 font-body italic">by {book.author}</p>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={handleReadPDF}
              className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-blood text-white rounded-xl hover:bg-blood-light transition text-sm sm:text-base"
            >
              <BookOpen className="w-5 h-5" />
              Read PDF
            </button>

            <button
              onClick={handleSave}
              disabled={saveLoading}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl transition text-sm sm:text-base ${
                isSaved
                  ? 'bg-blood text-white'
                  : 'bg-gothic-800 text-gray-300 hover:bg-gothic-700'
              }`}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Saved' : 'Save'}
            </button>

            <button
              onClick={handleDiscuss}
              className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-gothic-800 text-gray-300 rounded-xl hover:bg-gothic-700 transition text-sm sm:text-base"
            >
              <MessageCircle className="w-5 h-5" />
              {isMember ? 'Open Chat' : 'Discuss'}
            </button>
          </div>

          {book.description && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-white mb-3 font-heading">About</h3>
              <p className="text-gray-400 leading-relaxed font-body text-sm sm:text-base">{book.description}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gothic-800">
            <p className="text-sm text-gray-500 font-body">
              Added on {book.added_at ? new Date(book.added_at).toLocaleDateString() : 'Unknown date'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookDetailPage
