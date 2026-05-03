"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const page = () => {
  const router = useRouter()
  useEffect(() => { router.push("/documents") }, [])
}

export default page