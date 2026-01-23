import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

export default function Button({ variant = 'primary', children, ...rest }: ButtonProps) {
  const base = 'px-4 py-2 rounded-md font-medium'
  const cls = variant === 'primary' ? `${base} bg-amber-600 text-white` : `${base} bg-gray-100 text-gray-800`
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}

