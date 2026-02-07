import { describe, it, expect } from 'vitest'
import { cn, formatDate, getWeekNumber, getCurrentWeek } from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should merge tailwind classes', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })
  })

  describe('formatDate', () => {
    it('should format date string', () => {
      const result = formatDate('2026-02-07T12:00:00Z')
      expect(result).toMatch(/2026/)
    })
  })

  describe('getWeekNumber', () => {
    it('should return week number', () => {
      const date = new Date('2026-02-07')
      const week = getWeekNumber(date)
      expect(week).toBeGreaterThan(0)
      expect(week).toBeLessThanOrEqual(53)
    })
  })

  describe('getCurrentWeek', () => {
    it('should return current year and week', () => {
      const { year, week } = getCurrentWeek()
      expect(year).toBeGreaterThan(2020)
      expect(week).toBeGreaterThan(0)
      expect(week).toBeLessThanOrEqual(53)
    })
  })
})
