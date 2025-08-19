import React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'

// Placeholder type, sync with page.tsx
interface GalleryPhoto {
  id: string
  src: string
  alt: string
  location?: {
    country: string
    city: string
    spot: string
  }
  uploadDate?: string // Format like 'YYYY. MM. DD' based on Figma
}

interface PhotoPopupProps {
  photo: GalleryPhoto
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

const PhotoPopup: React.FC<PhotoPopupProps> = ({ photo, onClose, onNext, onPrev }) => {
  // Prevent background scroll when popup is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
        onClick={onClose} // Close on backdrop click
      >
        {/* Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white md:flex-row"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside content
        >
          {/* Image Container - Simplified: Relative position and width constraints */}
          {/* Image Container - Relative position and width constraints */}
          <div className="relative flex w-full items-center justify-center overflow-hidden md:w-2/3">
            {/* Use explicit width/height and object-contain style */}
            <Image
              src={photo.src}
              alt={photo.alt}
              width={1000} // Provide large intrinsic width
              height={1500} // Provide large intrinsic height (adjust ratio if needed)
              style={{
                objectFit: 'contain',
                width: 'auto',
                height: 'auto',
                maxHeight: '100%',
                maxWidth: '100%',
              }}
              sizes="(max-width: 768px) 90vw, 60vw"
              priority // Prioritize loading the main popup image
            />
          </div>

          {/* Info Panel - Allow vertical scrolling on desktop if content overflows */}
          <div className="flex w-full flex-col justify-between bg-neutral-800 p-4 text-white md:w-1/3 md:overflow-y-auto">
            <div>
              {photo.location && (
                <div className="mb-3 flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-neutral-400" />
                  <span>{photo.location.country}</span>
                  <span>{photo.location.city}</span>
                  <span className="font-semibold">{photo.location.spot}</span>
                </div>
              )}
              {photo.uploadDate && (
                <div className="text-xs text-neutral-400">
                  <span className="font-medium text-neutral-300">上傳日期:</span> {photo.uploadDate}
                </div>
              )}
            </div>
            {/* Add other details if needed */}
            <div className="mt-4 text-sm text-neutral-300">
              {/* Placeholder for description or other info */}
              {photo.alt}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full bg-black bg-opacity-50 p-2 text-white transition-colors hover:bg-opacity-75 md:right-4 md:top-4"
            aria-label="Close photo"
          >
            <X size={20} />
          </button>

          {/* Prev Button */}
          <button
            onClick={onPrev}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white transition-colors hover:bg-opacity-75"
            aria-label="Previous photo"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Next Button */}
          <button
            onClick={onNext}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white transition-colors hover:bg-opacity-75"
            aria-label="Next photo"
          >
            <ChevronRight size={24} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PhotoPopup
