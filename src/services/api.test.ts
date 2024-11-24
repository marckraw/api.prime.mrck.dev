import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchUserData } from './api'

describe('fetchUserData', () => {
  describe('Unit Tests', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should call correct URL', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, name: 'Test User' })
      })

      await fetchUserData(1)
      expect(fetch).toHaveBeenCalledWith('https://jsonplaceholder.typicode.com/users/1')
    })

    it('should handle 404 errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      })

      await expect(fetchUserData(1)).rejects.toThrow('User not found')
    })

    it('should handle invalid inputs', async () => {
      // @ts-expect-error Testing invalid input
      await expect(fetchUserData('invalid')).rejects.toThrow('Invalid user ID')
    })
  })
}) 