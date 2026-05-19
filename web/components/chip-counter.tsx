"use client"

import { useEffect, useState } from "react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"

interface ChipCounterProps {
  value: number
  suffix?: string
  prefix?: string
  label: string
  duration?: number
}

export function ChipCounter({ value, suffix = "", prefix = "", label, duration = 2 }: ChipCounterProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  useEffect(() => {
    if (!isInView) return

    let start = 0
    const end = value
    const incrementTime = (duration * 1000) / end
    const timer = setInterval(() => {
      start += Math.ceil(end / 50)
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, incrementTime)

    return () => clearInterval(timer)
  }, [isInView, value, duration])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="relative inline-block">
        {/* Chip decoration */}
        <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl" />
        <div className="relative art-deco-frame px-6 py-4 rounded-lg bg-card">
          <span className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary">
            {prefix}{count.toLocaleString()}{suffix}
          </span>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
    </motion.div>
  )
}

interface StatsGridProps {
  stats: Array<{
    value: number
    suffix?: string
    prefix?: string
    label: string
  }>
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {stats.map((stat, index) => (
        <ChipCounter
          key={stat.label}
          value={stat.value}
          suffix={stat.suffix}
          prefix={stat.prefix}
          label={stat.label}
        />
      ))}
    </div>
  )
}
