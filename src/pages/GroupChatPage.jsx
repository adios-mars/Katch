import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { auth } from '../firebase/config'
import {
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  getGroupMembers,
  addReaction,
  removeReaction,
  subscribeToMessages,
  updateMemberStatus
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
  Reply,
  Check,
  MessageCircle,
  ChevronDown
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
  const [userAvatar, setUserAvatar] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [typingUsers, setTypingUsers] = useState([])
  const [showMembers, setShowMembers] = useState(false)
  const [activeReactionMsg, setActiveReactionMsg] = useState(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)

  const [hasScrolledUp, setHasScrolledUp] = useState(false)
  const [justSentMessage, setJustSentMessage] = useState(false)

  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const inputAreaRef = useRef(null)
  const emojiRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const hasInitiallyScrolled = useRef(false)
  const lastMessageCount = useRef(0)

  // Close emoji picker on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ========== SMART SCROLL LOGIC ==========

  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return true
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    return scrollHeight - scrollTop - clientHeight < 150
  }, [])

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    })
  }, [])

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    const scrolledUp = distanceFromBottom > 150
    setHasScrolledUp(scrolledUp)
    setShowScrollButton(scrolledUp && messages.length > 0)
  }, [messages.length])

  // ========== LOAD DATA ==========

  const loadUsername = useCallback(async () => {
    const prof = await getProfile(user.uid)
    setUsername(prof?.username || user.displayName || user.email.split('@')[0])
    setUserAvatar(prof?.avatar_url || user?.photoURL || null)
  }, [user])

  const loadMembers = useCallback(async () => {
    const groupMembers = await getGroupMembers(id)

    const uniqueMembers = []
    const seenIds = new Set()

    for (const member of (groupMembers || [])) {
      if (!seenIds.has(member.user_id)) {
        seenIds.add(member.user_id)
        uniqueMembers.push(member)
      }
    }

    setMembers(uniqueMembers)
    setMemberCount(uniqueMembers.length)
  }, [id])

  const loadMessages = useCallback(async (shouldScroll = false) => {
    const msgs = await getMessages(id)
    lastMessageCount.current = msgs?.length || 0
    setMessages(msgs || [])
    setLoading(false)
    if (shouldScroll) {
      setTimeout(() => scrollToBottom(), 50)
    }
  }, [id, scrollToBottom])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    loadUsername()
    loadMembers()
    loadMessages().then(() => {
      if (!hasInitiallyScrolled.current) {
        setTimeout(() => {
          scrollToBottom()
          hasInitiallyScrolled.current = true
        }, 300)
      }
    })

    updateMemberStatus(id, user.uid, 'online')

    const unsubscribe = subscribeToMessages(id, (newMsgs) => {
      lastMessageCount.current = newMsgs.length

      setMessages(newMsgs)
      setLoading(false)

      if (justSentMessage) {
        setTimeout(() => scrollToBottom(), 100)
        setJustSentMessage(false)
      } else if (!hasScrolledUp && isNearBottom()) {
        setTimeout(() => scrollToBottom(), 100)
      }
    })

    const statusInterval = setInterval(() => {
      updateMemberStatus(id, user.uid, 'online')
    }, 30000)

    const handleBeforeUnload = () => {
      updateMemberStatus(id, user.uid, 'offline')
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      unsubscribe?.()
      clearInterval(statusInterval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      updateMemberStatus(id, user.uid, 'offline')
    }
  }, [id, user, navigate, loadUsername, loadMembers, loadMessages, scrollToBottom, isNearBottom, justSentMessage, hasScrolledUp])

  // ========== MESSAGE ACTIONS ==========

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    try {
      if (editingId) {
        await editMessage(editingId, user.uid, newMessage.trim())
        setEditingId(null)
      } else {
        await sendMessage(id, user.uid, username, newMessage.trim(), {
          replyTo: replyingTo?.id || null
        })
        setReplyingTo(null)
      }
      setNewMessage('')
      setShowEmoji(false)
      setJustSentMessage(true)
      setHasScrolledUp(false)
      loadMessages(true)
    } catch (err) {
      setError(err.message || 'Failed to send message')
    }
  }

  const handleDelete = useCallback(async (messageId, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!messageId || !user?.uid) return

    setDeletingId(messageId)
    setMessages(prev => prev.filter(m => m.id !== messageId))

    try {
      await deleteMessage(messageId, user.uid)
    } catch (err) {
      setError(err.message || 'Delete failed')
      await loadMessages(false)
    } finally {
      setDeletingId(null)
    }
  }, [user, loadMessages])

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
      loadMessages(false)
    } catch {
      setError('Failed to add reaction')
    }
  }

  const toggleReactionPicker = (msgId) => {
    setActiveReactionMsg(activeReactionMsg === msgId ? null : msgId)
  }

  const handleTyping = () => {
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {}, 3000)
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

  const getStatusColor = (status) => {
    if (status === 'online') return 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
    if (status === 'away') return 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
    return 'bg-gray-600'
  }

  const Avatar = ({ url, name, size = 'w-8 h-8', textSize = 'text-xs' }) => {
    if (url) {
      return (
        <img
          src={url}
          alt={name}
          className={`${size} rounded-full object-cover border border-gothic-700 shrink-0`}
          onError={(e) => {
            e.target.onerror = null
            e.target.style.display = 'none'
          }}
        />
      )
    }
    return (
      <div className={`${size} rounded-full bg-gothic-800 border border-gothic-700 flex items-center justify-center ${textSize} font-bold text-gray-400 shrink-0`}>
        {name?.[0]?.toUpperCase() || '?'}
      </div>
    )
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

  const uniqueMembers = []
  const seenIds = new Set()
  for (const m of members) {
    if (!seenIds.has(m.user_id)) {
      seenIds.add(m.user_id)
      uniqueMembers.push(m)
    }
  }

  const onlineMembers = uniqueMembers.filter((m) => m.status === 'online')
  const offlineMembers = uniqueMembers.filter((m) => m.status !== 'online')

  return (
    <div className="min-h-screen flex flex-col bg-gothic-950">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/80 border-b border-red-700/50 px-4 py-2 text-center text-red-200 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ===== HEADER ===== */}
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
                  <div key={m.user_id} className="relative">
                    <Avatar url={m.avatar_url} name={m.username} size="w-5 h-5" textSize="text-[8px]" />
                  </div>
                ))}
              </div>
              <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
              <span className="text-gothic-700">|</span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                Online
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowMembers(!showMembers)}
          className={`p-2 transition rounded-xl ${showMembers ? 'text-blood-light bg-gothic-800/50' : 'text-gray-400 hover:text-white hover:bg-gothic-800/50'}`}
        >
          <Users className="w-5 h-5" />
        </button>
      </div>

      {/* ===== MAIN AREA ===== */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 flex flex-col min-w-0">

          {/* Messages Container */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="w-16 h-16 rounded-full bg-gothic-800/50 border border-gothic-700/50 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-gothic-600" />
                </div>
                <p className="text-gray-500 text-lg font-heading">The silence is deafening</p>
                <p className="text-gray-600 text-sm mt-2 font-body italic">Be the first to break it</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.user_id === user?.uid
                const showAvatar = idx === 0 || messages[idx - 1].user_id !== msg.user_id
                const replyMsg = msg.reply_to ? messages.find((m) => m.id === msg.reply_to) : null
                const hasReactions = msg.reactions?.length > 0
                const showReactionPicker = activeReactionMsg === msg.id
                const isDeleting = deletingId === msg.id

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isDeleting ? 'opacity-40' : ''}`}>
                    <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[80%] md:max-w-[65%]`}>
                      {showAvatar && !isMe ? (
                        <Avatar url={msg.avatar_url} name={msg.username} />
                      ) : !isMe ? (
                        <div className="w-8 shrink-0" />
                      ) : null}

                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {showAvatar && (
                          <p className="text-xs text-gray-500 mb-1 font-body px-1">{msg.username}</p>
                        )}

                        <div className={`rounded-2xl px-4 py-3 ${isMe ? 'bg-blood text-white rounded-tr-md' : 'bg-gothic-800 text-gray-200 rounded-tl-md border border-gothic-700/50'} ${isDeleting ? 'animate-pulse' : ''}`}>
                          {replyMsg && (
                            <div className="mb-2 pl-3 border-l-2 border-blood/30 opacity-70">
                              <p className="text-xs text-blood-light font-medium">{replyMsg.username}</p>
                              <p className="text-xs text-gray-400 truncate">{replyMsg.content}</p>
                            </div>
                          )}

                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {msg.content}
                            {msg.edited && <span className="text-[10px] opacity-50 ml-1">(edited)</span>}
                          </p>

                          <p className={`text-[10px] opacity-50 mt-1.5 ${isMe ? 'text-right' : 'text-left'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>

                        {/* REACTIONS */}
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {hasReactions && msg.reactions.map((r) => (
                            <button
                              key={r.emoji}
                              onClick={() => handleReaction(msg.id, r.emoji)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition ${
                                r.users?.includes(user.uid)
                                  ? 'bg-blood/30 border-blood/50 text-white'
                                  : 'bg-gothic-800/80 border-gothic-700/50 text-gray-400 hover:border-blood/30'
                              } border`}
                            >
                              {r.emoji} {r.users?.length || 0}
                            </button>
                          ))}

                          <div className="relative">
                            <button
                              onClick={() => toggleReactionPicker(msg.id)}
                              className="p-1 text-xs hover:bg-gothic-800 rounded-lg transition text-gray-500 hover:text-blood-light"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>

                            {showReactionPicker && (
                              <div className="absolute bottom-full left-0 mb-1 z-50 bg-gothic-800 border border-gothic-700 rounded-xl p-2 shadow-xl flex gap-1">
                                {['❤️', '🔥', '💀', '✨', '👏', '🙏', '😂', '😮'].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => { handleReaction(msg.id, emoji); setActiveReactionMsg(null) }}
                                    className="p-1.5 hover:bg-gothic-700 rounded-lg transition text-lg"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className={`flex items-center gap-2 mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <button
                            onClick={() => startReply(msg)}
                            className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-blood-light transition font-body"
                          >
                            <Reply className="w-3 h-3" />
                            Reply
                          </button>

                          {isMe && (
                            <>
                              <span className="text-gothic-700 text-[10px]">|</span>
                              <button
                                onClick={() => startEdit(msg)}
                                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-white transition font-body"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </button>
                              <span className="text-gothic-700 text-[10px]">|</span>
                              <button
                                onClick={(e) => handleDelete(msg.id, e)}
                                disabled={isDeleting}
                                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-400 transition font-body disabled:opacity-30"
                              >
                                <Trash2 className="w-3 h-3" />
                                {isDeleting ? 'Deleting...' : 'Delete'}
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

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={() => {
                scrollToBottom()
                setHasScrolledUp(false)
                setShowScrollButton(false)
              }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-blood/90 text-white rounded-full text-sm font-body flex items-center gap-2 shadow-lg hover:bg-blood transition z-20 animate-bounce"
            >
              <ChevronDown className="w-4 h-4" />
              New messages
            </button>
          )}

          {typingUsers.length > 0 && (
            <div className="px-4 pb-1">
              <div className="flex items-center gap-2 text-gray-600 text-sm italic">
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blood animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blood animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blood animate-bounce" style={{ animationDelay: '0.3s' }} />
                </span>
                <span className="ml-1">{typingUsers.map((t) => t.username).join(', ')} is typing...</span>
              </div>
            </div>
          )}

          {replyingTo && (
            <div className="px-4 py-2 bg-gothic-900/50 border-t border-gothic-800/50 flex items-center gap-2">
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-body">Replying to <span className="text-blood-light">{replyingTo.username}</span></p>
                <p className="text-sm text-gray-400 truncate font-body italic">{replyingTo.content}</p>
              </div>
              <button onClick={cancelReply} className="p-1 text-gray-500 hover:text-blood-light transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ===== INPUT AREA ===== */}
          <form
            ref={inputAreaRef}
            onSubmit={handleSend}
            className="bg-gothic-900/80 backdrop-blur-md border-t border-gothic-800/50 p-4 flex items-end gap-2 relative shrink-0"
          >
            <div className="shrink-0">
              <Avatar url={userAvatar} name={username} size="w-9 h-9" textSize="text-sm" />
            </div>

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
                    onEmojiClick={(emojiData) => { setNewMessage((prev) => prev + emojiData.emoji); inputRef.current?.focus() }}
                    theme="dark"
                    width={300}
                    height={400}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 relative">
              {editingId && (
                <div className="absolute -top-8 left-0 flex items-center gap-2 text-xs text-gray-500 bg-gothic-800/80 px-2 py-1 rounded-lg">
                  <span>Editing message</span>
                  <button type="button" onClick={cancelEdit} className="text-gray-400 hover:text-blood-light">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); handleTyping() }}
                placeholder={editingId ? 'Editing message...' : replyingTo ? 'Reply to ' + replyingTo.username + '...' : 'Whisper into the void...'}
                className="w-full p-3.5 bg-gothic-800/60 border border-gothic-700/50 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-blood/30 focus:bg-gothic-800/80 transition font-body text-sm"
                onFocus={() => setShowEmoji(false)}
                onKeyDown={(e) => { if (e.key === 'Escape') { if (editingId) cancelEdit(); else if (replyingTo) cancelReply() } }}
              />
            </div>

            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-3.5 bg-blood text-white rounded-2xl hover:bg-blood-light transition shadow-[0_0_15px_rgba(139,21,56,0.3)] flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {editingId ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>

        {showMembers && (
          <div className="w-64 bg-gothic-900/50 border-l border-gothic-800/50 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 font-heading">Online Now</h3>
              {onlineMembers.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gothic-800/50 transition cursor-pointer group">
                  <div className="relative">
                    <Avatar url={m.avatar_url} name={m.username} size="w-9 h-9" textSize="text-sm" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${getStatusColor(m.status)} border-2 border-gothic-900`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 font-medium truncate">{m.username}</p>
                    <p className="text-xs text-gray-600">{m.status === 'online' ? 'Active now' : m.last_seen}</p>
                  </div>
                </div>
              ))}

              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-6 mb-4 font-heading">Offline</h3>
              {offlineMembers.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gothic-800/50 transition cursor-pointer opacity-60">
                  <Avatar url={m.avatar_url} name={m.username} size="w-9 h-9" textSize="text-sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 font-medium truncate">{m.username}</p>
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
