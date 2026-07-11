import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../firebase/config'
import { Mail, User, Lock } from 'lucide-react'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(result.user, { displayName: username })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      navigate('/') 
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/bg-login.jpg)' }} />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div className="relative z-10 w-full max-w-sm p-6 mx-4">
        <h2 className="text-3xl font-bold text-white font-heading text-center mb-6">{isSignUp ? 'Join the Realm' : 'Welcome Back'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-gothic-900/70 border border-gothic-700 rounded-2xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blood/50 font-body" required />
          </div>

          {isSignUp && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-gothic-900/70 border border-gothic-700 rounded-2xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blood/50 font-body" required />
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-gothic-900/70 border border-gothic-700 rounded-2xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blood/50 font-body" required />
          </div>

          {isSignUp && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-gothic-900/70 border border-gothic-700 rounded-2xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blood/50 font-body" required />
            </div>
          )}

          {error && <p className="text-blood-light text-sm text-center font-body">{error}</p>}

          <button type="submit" disabled={loading} className="w-full py-3.5 bg-blood text-white font-medium rounded-2xl hover:bg-blood-light transition font-heading tracking-wide disabled:opacity-50">
            {loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm font-body">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setError('') }} className="text-blood-light hover:text-blood-glow underline font-medium">
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default LoginPage