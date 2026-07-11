import { Link } from 'react-router-dom'
import { BookOpen, Users, MessageCircle, Mail, Send } from 'lucide-react'

function Footer() {
  return (
    <footer className="bg-gothic-950 border-t border-gothic-800/50 pt-12 pb-8 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* About Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blood-light" />
            <h3 className="text-lg font-bold text-white font-heading">About Us</h3>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed mb-4 font-body">
            Katch was born from a simple belief: <span className="text-blood-light italic">readers should never read alone.</span>
          </p>
          <p className="text-gray-600 text-sm leading-relaxed font-body">
            Welcome to a haven where stories never truly end. Explore dark romance, fantasy, and hidden literary gems, share PDF books, and join lively group discussions where every plot twist, theory, and heartbreak is worth talking about. Here, friendships begin with a book and grow beyond its final page.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Link to="/groups" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blood-light transition">
              <Users className="w-3.5 h-3.5" />
              Community
            </Link>
            <Link to="/library" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blood-light transition">
              <BookOpen className="w-3.5 h-3.5" />
              Share Books
            </Link>
            <Link to="/groups" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blood-light transition">
              <MessageCircle className="w-3.5 h-3.5" />
              Make Friends
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h3 className="text-lg font-bold text-white font-heading mb-4">WANDER</h3>
          <nav className="flex flex-col gap-3">
            <Link to="/" className="text-gray-500 text-sm hover:text-blood-light transition font-body">Library</Link>
            <Link to="/library" className="text-gray-500 text-sm hover:text-blood-light transition font-body">My Sanctum</Link>
            <Link to="/profile" className="text-gray-500 text-sm hover:text-blood-light transition font-body">Profile</Link>
            <Link to="/add-book" className="text-gray-500 text-sm hover:text-blood-light transition font-body">Add a Book</Link>
          </nav>
        </div>

        {/* Contact Section */}
        <div>
          <h3 className="text-lg font-bold text-white font-heading mb-4">WHISPER TO US</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4 font-body">
            Have a suggestion? Found a dark tale we should know about? Or just want to say hello? Reach out.
          </p>
          <div className="flex flex-col gap-3">
            {/* Contact Email */}
            <a 
              href="mailto:katchbooks@gmail.com" 
              className="flex items-center gap-3 text-gray-500 hover:text-blood-light transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-gothic-800/50 border border-gothic-700/50 flex items-center justify-center group-hover:border-blood/30 transition">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-sm font-body">katchbooks@gmail.com</span>
            </a>

            {/* TELEGRAM */}
            <a 
              href="https://t.me/katch_books_bot" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-gray-500 hover:text-blood-light transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-gothic-800/50 border border-gothic-700/50 flex items-center justify-center group-hover:border-blood/30 transition">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-sm font-body">Telegram</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-gothic-800/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-gray-700 text-xs font-body">
          Crafted with <span className="text-blood-light">♥</span> by a reader, for readers.
        </p>
        <p className="text-gray-700 text-xs font-body italic">
          "No force on earth shall part what love hath joined."
        </p>
      </div>
    </footer>
  )
}

export default Footer