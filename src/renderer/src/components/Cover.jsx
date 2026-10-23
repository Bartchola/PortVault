import React from 'react'

// Capa fallback: gera uma cor consistente por nome + as iniciais.
// Usada na Biblioteca e nas Conquistas.
export default function Cover({ name }) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="cover-fallback" style={{ background: `linear-gradient(135deg, hsl(${hue},60%,30%), hsl(${(hue + 60) % 360},60%,18%))` }}>
      <span>{initials}</span>
    </div>
  )
}
