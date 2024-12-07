import { describe, it, expect } from 'vitest'

const add = (num1: number, num2: number) => {
    return num1 + num2
}

const multiply = (num1: number, num2: number) => {
    return num1 * num2
}

describe('Math Utils', () => {
  describe('add', () => {
    it('should add two positive numbers correctly', () => {
      expect(add(2, 3)).toBe(5)
    })

    it('should handle negative numbers', () => {
      expect(add(-2, 3)).toBe(1)
      expect(add(-2, -3)).toBe(-5)
    })

    it('should return zero when adding zero', () => {
      expect(add(0, 5)).toBe(5)
      expect(add(5, 0)).toBe(5)
    })
  })

  describe('multiply', () => {
    it('should multiply two positive numbers', () => {
      expect(multiply(2, 3)).toBe(6)
    })

    it('should handle zero', () => {
      expect(multiply(5, 0)).toBe(0)
      expect(multiply(0, 5)).toBe(0)
    })
  })
}) 