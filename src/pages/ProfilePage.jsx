import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase/config'
import { syncProfileWithAuth, updateProfile, uploadAvatar, deleteOldAvatar } from '../hooks/useProfile'
import { getSavedBooks } from '../hooks/useLibrary'
import { User, BookOpen, Heart, Edit2, Save, Droplets, Skull, BookMarked, Sparkles, Crown, Feather, Camera, X, Plus } from 'lucide-react'

const POPULAR_GENRES = [
  'Fantasy', 'Dark Romance', 'Soft Romance', 'Horror',
  'Sci-Fi', 'Mystery', 'Thriller', 'Non-Fiction'
]

function safeInterests(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : [data]
    } catch {
      return [data]
    }
  }
  return []
}

function ProfilePage() {
  const navigate = useNavigate()
  const user = auth.currentUser
  const fileInputRef = useRef(null)
  const [profile, setProfile] = useState(null)
  const [savedBooks, setSavedBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [newInterest, setNewInterest] = useState('')
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    interests: []
  })

  const loadProfile = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const prof = await syncProfileWithAuth(user)
      if (prof) {
        setProfile(prof)
        setFormData({
          username: prof.username || user.displayName || user.email.split('@')[0],
          bio: prof.bio || '',
          interests: safeInterests(prof.interests)
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile')
    }
    try {
      const books = await getSavedBooks(user.uid)
      setSavedBooks(books)
    } catch (err) {
      setError(err.message || 'Failed to load saved books')
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadProfile()
  }, [user, navigate, loadProfile])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await updateProfile(user.uid, {
        username: formData.username,
        bio: formData.bio,
        favoriteGenre: formData.interests[0] || '',
        interests: formData.interests
      })
      setEditing(false)
      await loadProfile()
    } catch (err) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const addInterest = (interest) => {
    const trimmed = interest.trim()
    if (!trimmed) return
    if (formData.interests.includes(trimmed)) return
    setFormData({
      ...formData,
      interests: [...formData.interests, trimmed]
    })
    setNewInterest('')
  }

  const removeInterest = (interest) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(i => i !== interest)
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addInterest(newInterest)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => setAvatarPreview(e.target.result)
    reader.readAsDataURL(file)
    setUploadingAvatar(true)
    setError(null)
    try {
      if (profile?.avatar_url) {
        await deleteOldAvatar(profile.avatar_url)
      }
      const publicUrl = await uploadAvatar(file, user.uid)
      await updateProfile(user.uid, {
        username: formData.username || profile?.username || user.displayName,
        bio: formData.bio || profile?.bio || '',
        favoriteGenre: formData.interests[0] || profile?.favorite_genre || '',
        interests: formData.interests,
        avatarUrl: publicUrl
      })
      setAvatarPreview(null)
      await loadProfile()
    } catch (err) {
      setError(err.message || 'Failed to upload avatar')
      setAvatarPreview(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const currentlyReading = savedBooks.filter(b => b.status === 'reading').slice(0, 3)
  const recentlyFinished = savedBooks.filter(b => b.status === 'finished').slice(0, 3)
  const nextUp = savedBooks.filter(b => b.status === 'want_to_read').slice(0, 3)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gothic-950">
        <div className="text-center">
          <Sparkles className="w-8 h-8 text-blood-light mx-auto mb-3 animate-pulse" />
          <p className="text-gray-500 font-body italic">Summoning your profile...</p>
        </div>
      </div>
    )
  }

  const displayName = profile?.username || user?.displayName || user?.email?.split('@')[0] || 'Reader'
  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'Unknown'

  const avatarUrl = avatarPreview || profile?.avatar_url || user?.photoURL
  const interests = safeInterests(profile?.interests)

  return (
    <div className="min-h-screen bg-gothic-950 pb-12 relative overflow-hidden">
      <div className="vignette" />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-700/50 px-6 py-3 rounded-xl text-red-200 text-sm shadow-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gothic-900 via-gothic-950 to-gothic-950" />
        <div className="hero-glow" />
        <div className="blood-drip" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blood/40 to-transparent" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`particle particle-${i + 1}`} />
          ))}
        </div>
        <div className="mist-layer">
          <div className="mist-wave" />
          <div className="mist-wave mist-wave-2" />
        </div>

        <div className="relative z-10 p-8 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-blood/30 to-transparent rounded-full blur-md" />
              <div onClick={handleAvatarClick}
                className="relative w-24 h-24 rounded-full bg-gothic-800 border-2 border-gothic-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blood/50 transition-all duration-300">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-500" />
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {uploadingAvatar ? (
                    <Sparkles className="w-6 h-6 text-blood-light animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-gothic-800 rounded-full border border-gothic-700 flex items-center justify-center">
                <Crown className="w-3.5 h-3.5 text-blood-light" />
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-gray-500 font-body">Change photo</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              {editing ? (
                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block font-body uppercase tracking-wider">Name</label>
                    <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                      className="w-full p-3 bg-gothic-900 border border-gothic-700 rounded-xl text-white font-heading focus:outline-none focus:border-blood/50" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block font-body uppercase tracking-wider">Bio</label>
                    <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})}
                      placeholder="Tell your dark tale..." rows={2}
                      className="w-full p-3 bg-gothic-900 border border-gothic-700 rounded-xl text-white font-body italic focus:outline-none focus:border-blood/50 resize-none" />
                  </div>

                  <div>
                    <label className="text-gray-500 text-xs mb-2 block font-body uppercase tracking-wider">Interests</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.interests.map((interest, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blood/10 border border-blood/20 text-blood-light rounded-full text-sm font-body">
                          <Heart className="w-3 h-3" />
                          {interest}
                          <button onClick={() => removeInterest(interest)}
                            className="ml-1 p-0.5 hover:bg-blood/20 rounded-full transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 mb-3">
                      <input type="text" value={newInterest}
                        onChange={e => setNewInterest(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add interest..."
                        className="flex-1 p-2.5 bg-gothic-900 border border-gothic-700 rounded-xl text-white font-body text-sm focus:outline-none focus:border-blood/50" />
                      <button onClick={() => addInterest(newInterest)}
                        className="px-3 py-2 bg-blood/20 border border-blood/30 text-blood-light rounded-xl hover:bg-blood/30 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs text-gray-600 font-body mr-1">Quick add:</span>
                      {POPULAR_GENRES.filter(g => !formData.interests.includes(g)).slice(0, 8).map(genre => (
                        <button key={genre} onClick={() => addInterest(genre)}
                          className="px-2 py-1 bg-gothic-800/50 border border-gothic-700/50 text-gray-400 rounded-lg text-xs font-body hover:border-blood/30 hover:text-blood-light transition-all">
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blood text-white rounded-xl hover:bg-blood-light transition disabled:opacity-50 font-body text-sm">
                      <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => {
                      setEditing(false);
                      setFormData({
                        username: profile?.username || '',
                        bio: profile?.bio || '',
                        interests: safeInterests(profile?.interests)
                      })
                    }}
                      className="px-5 py-2.5 bg-gothic-800 text-gray-400 rounded-xl hover:bg-gothic-700 transition font-body text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <h1 className="text-3xl font-bold text-white font-heading">{displayName}</h1>
                    <button onClick={() => setEditing(true)}
                      className="p-2 text-gray-500 hover:text-blood-light transition rounded-lg hover:bg-gothic-800/50">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-400 mt-2 font-body italic max-w-md">
                    {profile?.bio || 'No bio yet... whisper your story to the void'}
                  </p>
                  {interests.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="text-gray-600 text-xs font-body flex items-center gap-1">
                        <Feather className="w-3 h-3" />Interests:
                      </span>
                      {interests.map((interest, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blood/10 border border-blood/20 text-blood-light rounded-full text-xs font-body">
                          <Heart className="w-3 h-3" />
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                    <span className="text-gray-600 text-xs font-body flex items-center gap-1">
                      <Feather className="w-3 h-3" />Member since {memberSince}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 max-w-4xl mx-auto -mt-2 relative z-10">
        <div className="grid grid-cols-2 gap-4">
          <div className="group relative bg-gothic-900/80 border border-gothic-800 rounded-2xl p-6 hover:border-blood/30 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blood/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-white font-heading">{savedBooks.length}</p>
                <p className="text-gray-500 text-sm font-body mt-1">Saved Books</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blood/10 border border-blood/20 flex items-center justify-center group-hover:bg-blood/20 transition-colors">
                <BookOpen className="w-6 h-6 text-blood-light" />
              </div>
            </div>
            <div className="mt-4 h-1 bg-gothic-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blood to-blood-light rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(savedBooks.length * 10, 100)}%` }} />
            </div>
          </div>

          <div className="group relative bg-gothic-900/80 border border-gothic-800 rounded-2xl p-6 hover:border-blood/30 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blood/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-white font-heading">{savedBooks.filter(b => b.status === 'finished').length}</p>
                <p className="text-gray-500 text-sm font-body mt-1">Books Finished</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-900/20 border border-emerald-800/30 flex items-center justify-center group-hover:bg-emerald-900/30 transition-colors">
                <Heart className="w-6 h-6 text-emerald-soft" />
              </div>
            </div>
            <div className="mt-4 h-1 bg-gothic-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-glow to-emerald-soft rounded-full transition-all duration-1000"
                style={{ width: `${savedBooks.length > 0 ? (savedBooks.filter(b => b.status === 'finished').length / savedBooks.length * 100) : 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 max-w-4xl mx-auto mt-10 space-y-10 relative z-10">
        {currentlyReading.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Droplets className="w-4 h-4 text-blood-light" />
              <h3 className="text-lg font-bold text-white font-heading">In My Veins</h3>
              <span className="text-gray-600 text-xs font-body">Currently Reading</span>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {currentlyReading.map(book => (
                <div key={book.book_id} onClick={() => navigate(`/book/${book.book_id}`)}
                  className="flex-shrink-0 w-24 cursor-pointer group">
                  <div className="relative">
                    <img src={book.cover || '/bg-login.jpg'} alt={book.title}
                      className="w-full h-36 object-cover rounded-lg shadow-lg group-hover:shadow-[0_0_15px_rgba(139,21,56,0.3)] transition-all duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="mt-2 text-xs text-gray-400 font-heading line-clamp-2 group-hover:text-blood-light transition-colors">{book.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {nextUp.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Skull className="w-4 h-4 text-gray-500" />
              <h3 className="text-lg font-bold text-white font-heading">Next Victim</h3>
              <span className="text-gray-600 text-xs font-body">Coming Soon</span>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {nextUp.map(book => (
                <div key={book.book_id} onClick={() => navigate(`/book/${book.book_id}`)}
                  className="flex-shrink-0 w-24 cursor-pointer group">
                  <div className="relative">
                    <img src={book.cover || '/bg-login.jpg'} alt={book.title}
                      className="w-full h-36 object-cover rounded-lg shadow-lg group-hover:shadow-[0_0_15px_rgba(139,21,56,0.2)] transition-all duration-300 opacity-70 group-hover:opacity-100" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 font-heading line-clamp-2 group-hover:text-gray-300 transition-colors">{book.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentlyFinished.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookMarked className="w-4 h-4 text-emerald-soft" />
              <h3 className="text-lg font-bold text-white font-heading">Buried</h3>
              <span className="text-gray-600 text-xs font-body">Recently Finished</span>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {recentlyFinished.map(book => (
                <div key={book.book_id} onClick={() => navigate(`/book/${book.book_id}`)}
                  className="flex-shrink-0 w-24 cursor-pointer group">
                  <div className="relative">
                    <img src={book.cover || '/bg-login.jpg'} alt={book.title}
                      className="w-full h-36 object-cover rounded-lg shadow-lg transition-all duration-300" />
                    <div className="absolute top-1 right-1 w-5 h-5 bg-emerald-900/80 rounded-full flex items-center justify-center border border-emerald-700/50">
                      <Sparkles className="w-3 h-3 text-emerald-soft" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-400 font-heading line-clamp-2 group-hover:text-emerald-soft transition-colors">{book.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {savedBooks.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gothic-800 mx-auto mb-4" />
            <p className="text-gray-600 font-heading text-lg">Your sanctum is empty</p>
            <p className="text-gray-700 font-body italic mt-2">Start saving books to see them here</p>
            <button onClick={() => navigate('/')}
              className="mt-6 px-8 py-3 bg-blood text-white rounded-xl hover:bg-blood-light transition font-body">Browse Library</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfilePage
