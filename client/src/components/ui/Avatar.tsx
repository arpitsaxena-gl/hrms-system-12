interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZES = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' }

export function Avatar({ src, name = '', size = 'md', className = '' }: AvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  if (src) {
    return <img src={src} alt={name} className={`rounded-full object-cover ${SIZES[size]} ${className}`} />
  }
  return (
    <div className={`rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-700 flex-shrink-0 ${SIZES[size]} ${className}`}>
      {initials}
    </div>
  )
}
