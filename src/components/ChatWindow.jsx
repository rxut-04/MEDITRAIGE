import React from 'react'

export default function ChatWindow({ children }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}
