import { supabase } from '../supabase/client'

const TABLE = 'profiles'

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found, not a real error
    return null
  }
  return data
}

export async function createProfile(userId, profile) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{
      user_id: userId,
      username: profile.username,
      bio: profile.bio || '',
      avatar_url: profile.avatarUrl || '',
      favorite_genre: profile.favoriteGenre || '',
      interests: profile.interests || []
    }])
    .select()

  if (error) throw new Error(error.message || 'Failed to create profile')
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      username: updates.username,
      bio: updates.bio,
      avatar_url: updates.avatarUrl,
      favorite_genre: updates.favoriteGenre,
      interests: updates.interests,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()

  if (error) throw new Error(error.message || 'Failed to update profile')
  return data
}

export async function syncProfileWithAuth(user) {
  if (!user) return null

  let profile = await getProfile(user.uid)

  if (!profile) {
    profile = await createProfile(user.uid, {
      username: user.displayName || user.email.split('@')[0],
      bio: '',
      favoriteGenre: ''
    })
    return profile?.[0] || profile
  }

  if (!profile.username && user.displayName) {
    const updated = await updateProfile(user.uid, {
      username: user.displayName,
      bio: profile.bio,
      favoriteGenre: profile.favorite_genre
    })
    return updated?.[0] || updated || profile
  }

  return profile
}

export async function uploadAvatar(file, userId) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase
    .storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (uploadError) throw new Error(uploadError.message || 'Failed to upload avatar')

  const { data } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(filePath)

  return data.publicUrl
}

export async function deleteOldAvatar(url) {
  if (!url) return
  const fileName = url.split('/').pop()
  if (!fileName) return

  const { error } = await supabase
    .storage
    .from('avatars')
    .remove([fileName])

  if (error) {
    // Silently fail — old avatar cleanup is not critical
    return
  }
}
