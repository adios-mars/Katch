import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getProfile } from './hooks/useProfile'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase/config'
import { Home, Library, PlusCircle, User, LogOut, Menu, X } from 'lucide-react'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import LibraryPage from './pages/LibraryPage'
import AddBookPage from './pages/AddBookPage'
import BookDetailPage from './pages/BookDetailPage'
import ProfilePage from './pages/ProfilePage'
import GroupsPage from './pages/GroupsPage'
import GroupChatPage from './pages/GroupChatPage'
import Footer from './components/Footer'

function NavItem({ to, icon: Icon, label, onClick }) {
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 transition-all duration-300 ${
        isActive 
          ? 'text-blood-light' 
          : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className={`text-sm font-medium overflow-hidden transition-all duration-300 ${
        isActive ? 'max-w-[100px] opacity-100 ml-1' : 'max-w-0 opacity-0 ml-0'
      }`}>
        {label}
      </span>
    </Link>
  )
}

function FooterWrapper() {
  const location = useLocation()
  const showFooter = location.pathname === '/'
  if (!showFooter) return null
  return (
    <>
      <div className="h-60" /> 
      <Footer />
    </>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [profileName, setProfileName] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      getProfile(user.uid).then(prof => {
        setProfileName(prof?.username || user.displayName || user.email)
      })
    }
  }, [user])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gothic-950 font-body text-gray-300 flex flex-col">
        {/* Top Navbar - Mobile Responsive */}
        <nav className="bg-gothic-100/80 backdrop-blur-md border-b border-gothic-800 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-50">

          {/* LEFT: Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Katch" className="w-8 h-8 invert brightness-0" />
            <span className="text-xl md:text-2xl text-blood-light font-gothic tracking-wide">Katch</span>
          </Link>

          {/* RIGHT: Desktop Nav + User */}
          <div className="hidden md:flex items-center gap-1">
            <NavItem to="/" icon={Home} label="Home" />
            <NavItem to="/library" icon={Library} label="Library" />
            <NavItem to="/add-book" icon={PlusCircle} label="Add" />
            <NavItem to="/profile" icon={User} label="Profile" />

            <div className="w-px h-6 bg-gothic-700 mx-2" />

            {user ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blood/20 flex items-center justify-center">
                  <span className="text-blood-light text-sm font-bold">
                    {(profileName || user.email)[0].toUpperCase()}
                  </span>
                </div>
                <button 
                  onClick={() => signOut(auth)} 
                  className="text-gray-500 hover:text-blood-light transition"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-blood text-white rounded-full hover:bg-blood-light transition font-medium text-sm">
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-400 hover:text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gothic-900/95 border-b border-gothic-800 px-4 py-4 space-y-2">
            <NavItem to="/" icon={Home} label="Home" onClick={() => setMobileMenuOpen(false)} />
            <NavItem to="/library" icon={Library} label="Library" onClick={() => setMobileMenuOpen(false)} />
            <NavItem to="/add-book" icon={PlusCircle} label="Add" onClick={() => setMobileMenuOpen(false)} />
            <NavItem to="/profile" icon={User} label="Profile" onClick={() => setMobileMenuOpen(false)} />

            {user ? (
              <button 
                onClick={() => { signOut(auth); setMobileMenuOpen(false) }} 
                className="flex items-center gap-2 text-gray-400 hover:text-blood-light transition px-3 py-2"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Logout</span>
              </button>
            ) : (
              <Link 
                to="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 bg-blood text-white rounded-full hover:bg-blood-light transition font-medium text-sm text-center"
              >
                Login
              </Link>
            )}
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/add-book" element={<AddBookPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/book/:id" element={<BookDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/group/:id" element={<GroupChatPage />} />
          </Routes>
        </main>

        <FooterWrapper />
      </div>
    </BrowserRouter>
  )
}

export default App