"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function ScrollToTop() {
  const router = useRouter()

  useEffect(() => {
    // Prevent automatic scroll restoration by browser
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }

    // Scroll to top on page load
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    }

    // Run immediately and also on mount to ensure it works
    scrollToTop()
    
    // Also run after a small delay to catch any delayed content rendering
    const timeoutId = setTimeout(scrollToTop, 50)

    return () => clearTimeout(timeoutId)
  }, [])

  return null
}
