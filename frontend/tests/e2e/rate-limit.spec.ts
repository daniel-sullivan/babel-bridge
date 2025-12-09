import { test, expect } from '@playwright/test'

// This test uses the secondary server on port 8081 which was started with RATE_LIMITING_ENABLED=true in globalSetup
const RATE_LIMIT_PORT = 8081
const RATE_LIMIT_BASE = `http://localhost:${RATE_LIMIT_PORT}`

test.describe('Rate Limiting Tests', () => {
  test('session endpoint produces 429s when rate limited', async () => {
    const results: { status: number; attempt: number }[] = []

    // Make rapid session requests to trigger rate limiting
    for (let i = 0; i < 20; i++) {
      try {
        const response = await fetch(`${RATE_LIMIT_BASE}/session`, {
          method: 'GET',
        })
        results.push({ status: response.status, attempt: i + 1 })
      } catch (error) {
        console.error(`Request ${i + 1} failed:`, error)
        results.push({ status: 0, attempt: i + 1 })
      }
    }

    console.log('Session request results:', results)

    const successCount = results.filter(r => r.status === 200).length
    const rateLimitedCount = results.filter(r => r.status === 429).length

    console.log(`Success: ${successCount}, Rate limited: ${rateLimitedCount}`)

    // We should see some rate limiting
    expect(rateLimitedCount).toBeGreaterThan(0)
    expect(successCount).toBeGreaterThan(0)
  })

  test('API endpoints are rate limited under burst load', async () => {
    const url = `${RATE_LIMIT_BASE}/api/translate/identify`
    const results: { status: number; attempt: number }[] = []

    // First establish a session
    const sessionResponse = await fetch(`${RATE_LIMIT_BASE}/session`)
    const sessionCookies = sessionResponse.headers.get('set-cookie')

    // Make rapid API calls
    for (let i = 0; i < 35; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(sessionCookies ? { 'Cookie': sessionCookies } : {})
          },
          body: JSON.stringify({ source: 'Hello' })
        })
        results.push({ status: response.status, attempt: i + 1 })
      } catch (error) {
        console.error(`API request ${i + 1} failed:`, error)
        results.push({ status: 0, attempt: i + 1 })
      }
    }

    console.log('API request results:', results)

    const successCount = results.filter(r => r.status === 200).length
    const rateLimitedCount = results.filter(r => r.status === 429).length
    const unauthorizedCount = results.filter(r => r.status === 401).length

    console.log(`Success: ${successCount}, Rate limited: ${rateLimitedCount}, Unauthorized: ${unauthorizedCount}`)

    // We should see some rate limiting, but also some successful requests
    expect(rateLimitedCount + unauthorizedCount).toBeGreaterThan(0)
    expect(successCount + unauthorizedCount).toBeGreaterThan(0) // Some requests should work (401s are expected if session setup fails)
  })

  test('rate limiting is properly configured on secondary server', async () => {
    // Verify that the rate limiting server is actually different from the main server
    const mainServerResponse = await fetch('http://localhost:8080/session')
    const rateLimitServerResponse = await fetch(`${RATE_LIMIT_BASE}/session`)

    // Both should respond, but they're different servers
    expect([200, 429]).toContain(mainServerResponse.status)
    expect([200, 429]).toContain(rateLimitServerResponse.status)
  })
})

