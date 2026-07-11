import { BookOpen } from 'lucide-react'

export function SkeletonCard() {
  return (
    <div className="bg-gothic-900/50 rounded-2xl p-3 animate-pulse">
      <div className="w-full aspect-[2/3] bg-gothic-800 rounded-xl mb-3" />
      <div className="h-4 bg-gothic-800 rounded-lg w-3/4 mb-2" />
      <div className="h-3 bg-gothic-800 rounded w-1/2" />
    </div>
  )
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

//  Skeleton for book detail page
export function SkeletonBookDetail() {
  return (
    <div className="min-h-screen bg-gothic-950 p-4 sm:p-8 animate-pulse">
      <div className="max-w-4xl mx-auto">
        {/* Back button placeholder */}
        <div className="h-6 bg-gothic-800 rounded w-24 mb-6" />

        <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
          {/* Book cover placeholder */}
          <div className="w-full md:w-1/3">
            <div className="aspect-[2/3] bg-gothic-800 rounded-2xl" />
          </div>

          {/* Book info placeholders */}
          <div className="flex-1 space-y-4">
            {/* Genre tag */}
            <div className="h-6 bg-gothic-800 rounded-full w-24" />

            {/* Title */}
            <div className="h-8 bg-gothic-800 rounded-lg w-3/4" />

            {/* Author */}
            <div className="h-5 bg-gothic-800 rounded w-1/2" />

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <div className="h-12 bg-gothic-800 rounded-xl w-32" />
              <div className="h-12 bg-gothic-800 rounded-xl w-28" />
              <div className="h-12 bg-gothic-800 rounded-xl w-28" />
            </div>

            {/* About section */}
            <div className="pt-6 space-y-3">
              <div className="h-6 bg-gothic-800 rounded w-20" />
              <div className="h-4 bg-gothic-800 rounded w-full" />
              <div className="h-4 bg-gothic-800 rounded w-full" />
              <div className="h-4 bg-gothic-800 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// NEW: Skeleton for profile page
export function SkeletonProfile() {
  return (
    <div className="min-h-screen bg-gothic-950 p-4 sm:p-8 animate-pulse">
      <div className="max-w-4xl mx-auto">
        {/* Profile header */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gothic-800" />
          <div className="space-y-3 flex-1">
            <div className="h-6 bg-gothic-800 rounded w-1/3" />
            <div className="h-4 bg-gothic-800 rounded w-1/4" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="h-20 sm:h-24 bg-gothic-800 rounded-2xl" />
          <div className="h-20 sm:h-24 bg-gothic-800 rounded-2xl" />
        </div>

        {/* Books section */}
        <div className="h-6 bg-gothic-800 rounded w-1/4 mb-4" />
        <SkeletonGrid count={4} />
      </div>
    </div>
  )
}

// NEW: Skeleton for chat page
export function SkeletonChat() {
  return (
    <div className="min-h-screen bg-gothic-950 flex flex-col animate-pulse">
      {/* Header */}
      <div className="h-16 bg-gothic-900/50 border-b border-gothic-800" />

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4">
        <div className="flex justify-start">
          <div className="h-12 bg-gothic-800 rounded-2xl rounded-tl-md w-2/3 max-w-md" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 bg-blood/20 rounded-2xl rounded-tr-md w-1/2 max-w-md" />
        </div>
        <div className="flex justify-start">
          <div className="h-16 bg-gothic-800 rounded-2xl rounded-tl-md w-3/4 max-w-md" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 bg-blood/20 rounded-2xl rounded-tr-md w-1/3 max-w-md" />
        </div>
      </div>


      <div className="h-20 bg-gothic-900/50 border-t border-gothic-800" />
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gothic-800/50 border border-gothic-700/50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gothic-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-400 font-heading mb-2">{title}</h3>
      <p className="text-gray-600 text-sm max-w-md font-body italic mb-4">{description}</p>
      {action}
    </div>
  )
}