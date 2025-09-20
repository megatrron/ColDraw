// Removed unused eslint-disable directive
// lib/useJaas.ts
'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

// interface JaasConfig {
//   roomId: string
//   userName: string
//   userId: string
// }

interface Session {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function useJaas ({session, roomId}:{session: Session, roomId: string}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load JaaS script
//   useEffect(() => {
//     if (window.JitsiMeetExternalAPI) {
//       setIsLoaded(true)
//       return
//     }

//     const script = document.createElement('script')
//     script.src = `https://8x8.vc/${process.env.NEXT_PUBLIC_JAAS_APP_ID}/external_api.js`
//     script.async = true
    
//     script.onload = () => setIsLoaded(true)
//     script.onerror = () => setError('Failed to load JaaS')
    
//     document.head.appendChild(script)
//   }, [])

  // Get JWT token
  useEffect(() => {
    // if (!isLoaded) return
    console.log('JaaS is loaded, fetching token...');
    const fetchToken = async () => {
    //   const fullRoomName = `${process.env.NEXT_PUBLIC_JAAS_APP_ID}/drawing-room-${roomId}`;
      console.log('Fetching token for JaaS...');
      try {
        // const response2 = await fetch('/api/jitsi/token', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     id: session.user.id,
        //     name: session.user.name,
        //     email: session.user.email,
        //   }),
        // })
        const response = await axios.post('/api/jitsi/token', {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          roomName: roomId
        })
        setIsLoaded(true);

        const data = response.data
        console.log('Jitsi token response:', data)
        if (data.token) {
          setToken(data.token!)
        } else {
          setError('Failed to get token')
        }
      } catch {
        setError('Token request failed')
      }
    }

    fetchToken()
  }, [session.user.name, session.user.id, session.user.email, roomId])

  return { isLoaded, token, error }
}