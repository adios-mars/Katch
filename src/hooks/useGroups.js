import { supabase } from '../supabase/client'

// ========== GROUPS ==========

export async function getGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get groups error:', error)
    return []
  }
  return data || []
}

export async function getGroupsByBook(bookId) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('book_id', bookId)

  if (error) {
    console.error('Get groups by book error:', error)
    return []
  }
  return data || []
}

export async function createGroup(group) {
  const { data, error } = await supabase
    .from('groups')
    .insert([{
      name: group.name,
      book_id: group.bookId,
      book_title: group.bookTitle,
      created_by: group.createdBy
    }])
    .select()

  if (error) {
    console.error('Create group error:', error)
    throw error
  }
  return data?.[0]
}

export async function joinGroup(groupId, userId) {
  const { data, error } = await supabase
    .from('group_members')
    .insert([{
      group_id: groupId,
      user_id: userId,
      status: 'online',
      last_seen: new Date().toISOString()
    }])
    .select()

  if (error) {
    console.error('Join group error:', error)
    throw error
  }
  return data
}

export async function isGroupMember(groupId, userId) {
  const { data, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Check member error:', error)
  }
  return !!data
}

export async function getGroupMembersCount(groupId) {
  const { count, error } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)

  if (error) {
    console.error('Get members count error:', error)
    return 0
  }
  return count || 0
}

export async function getGroupMembers(groupId) {
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id, status, last_seen')
    .eq('group_id', groupId)

  if (membersError) {
    console.error('Get members error:', membersError)
    return []
  }

  if (!members || members.length === 0) return []

  const userIds = members.map(m => m.user_id)

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, username, avatar_url')
    .in('user_id', userIds)

  if (profilesError) {
    console.error('Get profiles error:', profilesError)
  }

  const profileMap = {}
  profiles?.forEach(p => {
    profileMap[p.user_id] = {
      username: p.username,
      avatar_url: p.avatar_url
    }
  })

  return members.map(m => ({
    user_id: m.user_id,
    status: m.status || 'offline',
    last_seen: m.last_seen,
    username: profileMap[m.user_id]?.username || 'Anonymous',
    avatar_url: profileMap[m.user_id]?.avatar_url || null
  }))
}

export async function updateMemberStatus(groupId, userId, status) {
  try {
    const { data: existing } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('group_members')
        .update({ 
          status: status,
          last_seen: new Date().toISOString()
        })
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) {
        console.error('Update status error:', error)
      }
    }
  } catch (err) {
    
  }
}

// ========== MESSAGES ==========

export async function getMessages(groupId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Get messages error:', error)
    return []
  }
  return data || []
}

export async function sendMessage(groupId, userId, username, content, options = {}) {
  const insertData = {
    group_id: groupId,
    user_id: userId,
    username: username,
    content: content,
    reply_to: options.replyTo || null
  }

  const { data, error } = await supabase
    .from('messages')
    .insert([insertData])
    .select()

  if (error) {
    console.error('Send message error:', error)
    throw error
  }
  return data?.[0]
}

export async function deleteMessage(messageId, userId) {
  if (!messageId) {
    throw new Error('Missing messageId')
  }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (error) {
    console.error('Delete message error:', error)
    throw new Error('Failed to delete: ' + error.message)
  }
}

export async function editMessage(messageId, userId, newContent) {
  const { data, error } = await supabase
    .from('messages')
    .update({ 
      content: newContent,
      edited: true 
    })
    .eq('id', messageId)
    .eq('user_id', userId)
    .select()

  if (error) {
    console.error('Edit message error:', error)
    throw error
  }
  return data
}

// ========== REACTIONS ==========

export async function addReaction(messageId, userId, emoji) {
  const { data: msg, error: fetchError } = await supabase
    .from('messages')
    .select('reactions')
    .eq('id', messageId)
    .single()

  if (fetchError) {
    console.error('Fetch reactions error:', fetchError)
    throw fetchError
  }

  let reactions = msg?.reactions || []
  const existingIndex = reactions.findIndex(r => r.emoji === emoji)

  if (existingIndex >= 0) {
    if (!reactions[existingIndex].users.includes(userId)) {
      reactions[existingIndex].users.push(userId)
    }
  } else {
    reactions.push({ emoji, users: [userId] })
  }

  const { error } = await supabase
    .from('messages')
    .update({ reactions })
    .eq('id', messageId)

  if (error) throw error
}

export async function removeReaction(messageId, userId, emoji) {
  const { data: msg, error: fetchError } = await supabase
    .from('messages')
    .select('reactions')
    .eq('id', messageId)
    .single()

  if (fetchError) {
    console.error('Fetch reactions error:', fetchError)
    throw fetchError
  }

  let reactions = msg?.reactions || []
  const existingIndex = reactions.findIndex(r => r.emoji === emoji)

  if (existingIndex >= 0) {
    reactions[existingIndex].users = reactions[existingIndex].users.filter(u => u !== userId)
    if (reactions[existingIndex].users.length === 0) {
      reactions.splice(existingIndex, 1)
    }
  }

  const { error } = await supabase
    .from('messages')
    .update({ reactions })
    .eq('id', messageId)

  if (error) throw error
}

// ========== REALTIME ==========

export function subscribeToMessages(groupId, callback) {
  const subscription = supabase
    .channel(`messages:${groupId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `group_id=eq.${groupId}`
    }, () => {
      getMessages(groupId).then(callback)
    })
    .subscribe()

  return () => supabase.removeChannel(subscription)
}