import { describe, it, expect } from 'vitest'
import { generateId } from '../../src/utils/id'

describe('generateId', () => {
  it('generates a string ID', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('generates unique IDs', () => {
    const ids = new Set()
    const iterations = 1000

    for (let i = 0; i < iterations; i++) {
      ids.add(generateId())
    }

    // All IDs should be unique
    expect(ids.size).toBe(iterations)
  })

  it('generates IDs without spaces or special characters', () => {
    const id = generateId()

    // Should only contain alphanumeric characters and common safe characters
    expect(id).toMatch(/^[a-zA-Z0-9_-]+$/)
  })

  it('generates IDs of consistent format', () => {
    const id1 = generateId()
    const id2 = generateId()

    // Both should be strings of reasonable length
    expect(id1.length).toBeGreaterThan(8)
    expect(id2.length).toBeGreaterThan(8)
    expect(id1.length).toBeLessThan(100)
    expect(id2.length).toBeLessThan(100)
  })

  it('is deterministic enough for testing but random in practice', () => {
    const id1 = generateId()
    const id2 = generateId()

    // Should be different
    expect(id1).not.toBe(id2)
  })

  it('handles rapid successive calls', () => {
    const ids = []

    for (let i = 0; i < 100; i++) {
      ids.push(generateId())
    }

    // All should be unique even when generated rapidly
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('generates IDs suitable for DOM element IDs', () => {
    const id = generateId()

    // Should start with a letter or underscore (valid CSS identifier)
    expect(id).toMatch(/^[a-zA-Z_]/)

    // Should not contain spaces or problematic characters
    expect(id).not.toMatch(/\s/)
    expect(id).not.toMatch(/[<>'"&]/)
  })

  it('maintains good performance', () => {
    const startTime = performance.now()

    for (let i = 0; i < 1000; i++) {
      generateId()
    }

    const endTime = performance.now()
    const duration = endTime - startTime

    // Should generate 1000 IDs in reasonable time (less than 500ms)
    expect(duration).toBeLessThan(500)
  })

  it('produces IDs without leading zeros that could be confused', () => {
    const ids = []

    for (let i = 0; i < 50; i++) {
      ids.push(generateId())
    }

    // None should start with '0' as this could be confusing
    const startsWithZero = ids.some(id => id.startsWith('0'))
    expect(startsWithZero).toBe(false)
  })

  it('generates IDs with sufficient entropy', () => {
    const ids = new Set()

    // Generate many IDs and check for reasonable distribution
    for (let i = 0; i < 10000; i++) {
      ids.add(generateId())
    }

    // Should have all unique IDs (good entropy)
    expect(ids.size).toBe(10000)

    // Check character distribution is reasonable
    const allChars = Array.from(ids).join('')
    const uniqueChars = new Set(allChars)

    // Should use a reasonable variety of characters
    expect(uniqueChars.size).toBeGreaterThan(10)
  })
})
