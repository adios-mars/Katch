import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { auth } from '../firebase/config'
import {
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  getGroupMembersCount,
  getGroupMembers,
  addReaction,
  removeReaction,
  subscribeToMessages,

} from '../hooks/useGroups'
import { getProfile } from '../hooks/useProfile'
import {
  ArrowLeft,
  Send,
  Users,
  Trash2,
  Edit2,
  X,
  Smile,
  Image as ImageIcon,
  Reply,
  Check,
  MessageCircle
} from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'

function GroupChatPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = auth.currentUser
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [memberCount, setMemberCount] = useState(0)
  const [members, setMembers] = useState([])
  const [username, setUsername] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [typingUsers, setTypingUsers] = useState([])
  const [showMembers, setShowMembers] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const emojiRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

 
  useEffect(() => {
    function handleClickOutside(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadUsername()
    loadMembers()
    loadMemberCount()
    loadMessages()

    
    const unsubscribe = subscribeToMessages(id, (newMsgs) => {
      setMessages(newMsgs)
      setLoading(false)
    })

    
    const typingInterval = setInterval(() => {
      
      if (Math.random() > 0.7) {
        setTypingUsers([{ username: 'Vesper', user_id: 'user2' }])
        setTimeout(() => setTypingUsers([]), 3000)
      }
    }, 5000)

    return () => {
      unsubscribe?.()
      clearInterval(typingInterval)
    }
  }, [id, user])

  const loadUsername = async () => {
    const prof = await getProfile(user.uid)
    setUsername(prof?.username || user.displayName || user.email.split('@')[0])
  }

  const loadMembers = async () => {
    const groupMembers = await getGroupMembers(id)
    setMembers(groupMembers || [])
  }

  const loadMemberCount = async () => {
    const count = await getGroupMembersCount(id)
    setMemberCount(count)
  }

  const loadMessages = async () => {
    const msgs = await getMessages(id)
    setMessages(msgs || [])
    setLoading(false)
    scrollToBottom()
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

 
  const handleSend = async (e) => {
    e.preventDefault()
    if ((!newMessage.trim() && !imageFile) || !user) return

    try {
      let imageUrl = null

     
      if (imageFile) {
        imageUrl = await uploadChatImage(imageFile)
      }

      if (editingId) {
        await editMessage(editingId, user.uid, newMessage.trim())
        setEditingId(null)
        showToast('Message edited')
      } else {
        await sendMessage(id, user.uid, username, newMessage.trim(), {
          replyTo: replyingTo?.id || null,
          imageUrl: imageUrl
        })
        setReplyingTo(null)
        setImagePreview(null)
        setImageFile(null)
        showToast('Message sent')
      }
      setNewMessage('')
      setShowEmoji(false)
      loadMessages()
    } catch (err) {
      console.error('Send error:', err)
      showToast('Failed to send', 'error')
    }
  }

  const handleDelete = async (messageId) => {
    if (!confirm('Delete this message?')) return
    try {
      await deleteMessage(messageId, user.uid)
      showToast('Message deleted')
      loadMessages()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const startEdit = (msg) => {
    setEditingId(msg.id)
    setNewMessage(msg.content)
    setReplyingTo(null)
    setShowEmoji(false)
    inputRef.current?.focus()
  }

  const cancelEdit = () => {
    setEditingId(null)
    setNewMessage('')
  }

  const startReply = (msg) => {
    setReplyingTo(msg)
    setEditingId(null)
    setNewMessage('')
    setShowEmoji(false)
    inputRef.current?.focus()
  }

  const cancelReply = () => {
    setReplyingTo(null)
  }

  const handleReaction = async (messageId, emoji) => {
    try {
      const msg = messages.find((m) => m.id === messageId)
      const existing = msg?.reactions?.find(
        (r) => r.emoji === emoji && r.users?.includes(user.uid)
      )
      if (existing) {
        await removeReaction(messageId, user.uid, emoji)
      } else {
        await addReaction(messageId, user.uid, emoji)
      }
      loadMessages()
    } catch (err) {
      console.error('Reaction error:', err)
    }
  }

  
  const handleTyping = () => {
    clearTimeout(typingTimeoutRef.current)
    
    typingTimeoutRef.current = setTimeout(() => {}, 3000)
  }

 

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', 'error')
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const cancelImageUpload = () => {
    setImageFile(null)
    setImagePreview(null)
  }

 

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' })
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const formatFullDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    if (status === 'online') return 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
    if (status === 'away') return 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
    return 'bg-gray-600'
  }

  const showToast = (message, type = 'success') => {
   
    console.log(`[${type}] ${message}`)
  }

 

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gothic-950">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blood/30 border-t-blood rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-body italic">Summoning messages...</p>
        </div>
      </div>
    )
  }

  const onlineMembers = members.filter((m) => m.status === 'online')
  const offlineMembers = members.filter((m) => m.status !== 'online')

  return (
    <div className="min-h-screen flex flex-col bg-gothic-950">
      
      <div className="bg-gothic-900/80 backdrop-blur-md border-b border-gothic-800/50 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-blood-light transition p-2 rounded-xl hover:bg-gothic-800/50"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
              Group Chat
            </h2>
            <div className="flex items-center gap-2 text-gray-500 text-sm mt-0.5">
              <div className="flex -space-x-1.5">
                {onlineMembers.slice(0, 3).map((m) => (
                  <div
                    key={m.user_id}
                    className="w-5 h-5 rounded-full bg-gothic-700 border border-gothic-800 flex items-center justify-center text-[8px] font-bold text-gray-400"
                  >
                    {m.username?.[0] || '?'}
                  </div>
                ))}
              </div>
              <span>{memberCount} members</span>
              <span className="text-gothic-700">|</span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                Live
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowMembers(!showMembers)}
          className={`p-2 transition rounded-xl ${
            showMembers
              ? 'text-blood-light bg-gothic-800/50'
              : 'text-gray-400 hover:text-white hover:bg-gothic-800/50'
          }`}
        >
          <Users className="w-5 h-5" />
        </button>
      </div>

      
      <div className="flex flex-1 overflow-hidden">
        
        <div className="flex-1 flex flex-col min-w-0">
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-1 scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="w-16 h-16 rounded-full bg-gothic-800/50 border border-gothic-700/50 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-gothic-600" />
                </div>
                <p className="text-gray-500 text-lg font-heading">
                  The silence is deafening
                </p>
                <p className="text-gray-600 text-sm mt-2 font-body italic">
                  Be the first to break it
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.user_id === user?.uid
                const showAvatar =
                  idx === 0 || messages[idx - 1].user_id !== msg.user_id
                const replyMsg = msg.reply_to
                  ? messages.find((m) => m.id === msg.reply_to)
                  : null

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div
                      className={`flex ${
                        isMe ? 'flex-row-reverse' : 'flex-row'
                      } items-end gap-2 max-w-[80%] md:max-w-[65%]`}
                    >
                      {/* Avatar */}
                      {showAvatar && !isMe ? (
                        <div className="w-8 h-8 rounded-full bg-gothic-800 border border-gothic-700 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0 mb-1">
                          {msg.username?.[0] || '?'}
                        </div>
                      ) : !isMe ? (
                        <div className="w-8 shrink-0" />
                      ) : null}

                      <div
                        className={`flex flex-col ${
                          isMe ? 'items-end' : 'items-start'
                        }`}
                      >
                       
                        {showAvatar && (
                          <p className="text-xs text-gray-500 mb-1 font-body px-1">
                            {msg.username}
                          </p>
                        )}

                       
                        <div
                          className={`rounded-2xl px-4 py-3 relative ${
                            isMe
                              ? 'bg-blood text-white rounded-tr-md'
                              : 'bg-gothic-800 text-gray-200 rounded-tl-md border border-gothic-700/50'
                          }`}
                        >
                         
                          {replyMsg && (
                            <div className="mb-2 pl-3 border-l-2 border-blood/30 opacity-70">
                              <p className="text-xs text-blood-light font-medium">
                                {replyMsg.username}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {replyMsg.content}
                              </p>
                            </div>
                          )}

                          {msg.image_url && (
                            <div className="mt-2">
                              <img
                                src={msg.image_url}
                                alt="Shared"
                                className="max-w-[200px] rounded-lg border border-gothic-700/50 cursor-pointer hover:opacity-90 transition"
                                onClick={() =>
                                  window.open(msg.image_url, '_blank')
                                }
                              />
                            </div>
                          )}

                         
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {msg.content}
                            {msg.edited && (
                              <span className="text-[10px] opacity-50 ml-1">
                                (edited)
                              </span>
                            )}
                          </p>

                         
                          {msg.reactions?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {msg.reactions.map((r) => (
                                <button
                                  key={r.emoji}
                                  onClick={() =>
                                    handleReaction(msg.id, r.emoji)
                                  }
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition ${
                                    r.users?.includes(user.uid)
                                      ? 'bg-blood/30 border-blood/50 text-white'
                                      : 'bg-gothic-800/80 border-gothic-700/50 text-gray-400 hover:border-blood/30'
                                  } border`}
                                >
                                  {r.emoji} {r.users?.length || 0}
                                </button>
                              ))}
                            </div>
                          )}

                        
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] opacity-50">
                              {formatTime(msg.created_at)}
                            </span>
                            {isMe && (
                              <span className="text-[10px] opacity-50">
                                {msg.read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>

                       
                        <div
                          className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                            isMe ? 'flex-row-reverse' : ''
                          }`}
                        >
                          {['❤️', '🔥', '💀', '✨', '👏', '🙏'].map(
                            (emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                className="p-1 text-xs hover:bg-gothic-800 rounded-lg transition text-gray-500 hover:text-white"
                              >
                                {emoji}
                              </button>
                            )
                          )}
                          <button
                            onClick={() => startReply(msg)}
                            className="p-1 text-xs hover:bg-gothic-800 rounded-lg transition text-gray-500 hover:text-blood-light flex items-center gap-1"
                          >
                            <Reply className="w-3 h-3" />
                            Reply
                          </button>
                          {isMe && (
                            <>
                              <button
                                onClick={() => startEdit(msg)}
                                className="p-1 text-xs hover:bg-gothic-800 rounded-lg transition text-gray-500 hover:text-white"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(msg.id)}
                                className="p-1 text-xs hover:bg-gothic-800 rounded-lg transition text-gray-500 hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

         
          {typingUsers.length > 0 && (
            <div className="px-4 pb-1">
              <div className="flex items-center gap-2 text-gray-600 text-sm italic">
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blood animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-blood animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-blood animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  />
                </span>
                <span className="ml-1">
                  {typingUsers.map((t) => t.username).join(', ')} is typing...
                </span>
              </div>
            </div>
          )}

         
          {replyingTo && (
            <div className="px-4 py-2 bg-gothic-900/50 border-t border-gothic-800/50 flex items-center gap-2">
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-body">
                  Replying to{' '}
                  <span className="text-blood-light">
                    {replyingTo.username}
                  </span>
                </p>
                <p className="text-sm text-gray-400 truncate font-body italic">
                  {replyingTo.content}
                </p>
              </div>
              <button
                onClick={cancelReply}
                className="p-1 text-gray-500 hover:text-blood-light transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {imagePreview && (
            <div className="px-4 py-2 bg-gothic-900/50 border-t border-gothic-800/50 flex items-center gap-3">
              <div className="relative">
                <img
                  src={imagePreview}
                  className="w-16 h-16 object-cover rounded-lg border border-gothic-700"
                />
                <button
                  onClick={cancelImageUpload}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blood text-white rounded-full flex items-center justify-center text-xs hover:bg-blood-light transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <span className="text-sm text-gray-500 font-body">
                Image ready to send
              </span>
            </div>
          )}

         
          <form
            onSubmit={handleSend}
            className="bg-gothic-900/80 backdrop-blur-md border-t border-gothic-800/50 p-4 flex items-end gap-2 relative"
          >
            <input
              type="file"
              id="image-input"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

          
            <button
              type="button"
              onClick={() => document.getElementById('image-input').click()}
              className="p-3 text-gray-500 hover:text-blood-light transition rounded-xl hover:bg-gothic-800/50 flex-shrink-0"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

           
            <div className="relative" ref={emojiRef}>
              <button
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                className="p-3 text-gray-500 hover:text-blood-light transition rounded-xl hover:bg-gothic-800/50 flex-shrink-0"
              >
                <Smile className="w-5 h-5" />
              </button>
              {showEmoji && (
                <div className="absolute bottom-full left-0 mb-2 z-50">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setNewMessage((prev) => prev + emojiData.emoji)
                      inputRef.current?.focus()
                    }}
                    theme="dark"
                    width={300}
                    height={400}
                  />
                </div>
              )}
            </div>

          
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  handleTyping()
                }}
                placeholder={
                  editingId
                    ? 'Editing message...'
                    : replyingTo
                    ? 'Reply to ' + replyingTo.username + '...'
                    : 'Whisper into the void...'
                }
                className="w-full p-3.5 bg-gothic-800/60 border border-gothic-700/50 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-blood/30 focus:bg-gothic-800/80 transition font-body text-sm"
                onFocus={() => setShowEmoji(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    if (editingId) cancelEdit()
                    else if (replyingTo) cancelReply()
                  }
                }}
              />
            </div>

           
            <button
              type="submit"
              disabled={!newMessage.trim() && !imageFile}
              className="p-3.5 bg-blood text-white rounded-2xl hover:bg-blood-light transition shadow-[0_0_15px_rgba(139,21,56,0.3)] flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

       
        {showMembers && (
          <div className="w-64 bg-gothic-900/50 border-l border-gothic-800/50 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 font-heading">
                Online Now
              </h3>
              {onlineMembers.map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gothic-800/50 transition cursor-pointer group"
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gothic-800 border border-gothic-700 flex items-center justify-center text-sm font-bold text-gray-400 group-hover:text-white transition">
                      {m.username?.[0] || '?'}
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${getStatusColor(
                        m.status
                      )} border-2 border-gothic-900`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 font-medium truncate">
                      {m.username}
                    </p>
                    <p className="text-xs text-gray-600">
                      {m.status === 'online' ? 'Active now' : m.last_seen}
                    </p>
                  </div>
                </div>
              ))}

              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-6 mb-4 font-heading">
                Offline
              </h3>
              {offlineMembers.map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gothic-800/50 transition cursor-pointer opacity-60"
                >
                  <div className="w-9 h-9 rounded-full bg-gothic-800 border border-gothic-700 flex items-center justify-center text-sm font-bold text-gray-500">
                    {m.username?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 font-medium truncate">
                      {m.username}
                    </p>
                    <p className="text-xs text-gray-600">{m.last_seen}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupChatPage