import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  url: string
  floueUrl: string | null
  alt: string
  className?: string
}

/** Aperçu flouté immédiat, puis la photo en fondu une fois téléchargée. Chargement différé (CLAUDE.md §8). */
export function PhotoPlat({ url, floueUrl, alt, className }: Props) {
  const [chargee, setChargee] = useState(false)

  return (
    <div
      className={cn('overflow-hidden bg-muted bg-cover bg-center', className)}
      style={floueUrl ? { backgroundImage: `url(${floueUrl})` } : undefined}
    >
      <img
        src={url}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={400}
        height={400}
        onLoad={() => setChargee(true)}
        className={cn('size-full object-cover transition-opacity duration-300', chargee ? 'opacity-100' : 'opacity-0')}
      />
    </div>
  )
}
