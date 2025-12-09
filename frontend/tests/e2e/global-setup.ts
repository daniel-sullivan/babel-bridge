import { spawn, ChildProcess } from 'child_process'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const GO_CMD = 'go'
const ROOT = path.resolve(__dirname, '..', '..', '..')

function startGoServer(port: string, engine: string, rateLimiting: string): ChildProcess {
  const env = { ...process.env, ENGINE: engine, PORT: port }
  if (rateLimiting) env.RATE_LIMITING_ENABLED = rateLimiting

  console.log(`Starting Go server on port ${port} with ENGINE=${engine}${rateLimiting ? ' RATE_LIMITING_ENABLED=' + rateLimiting : ''}`)

  // spawn `go run main.go` in the repo root
  const p = spawn(GO_CMD, ['run', 'main.go'], {
    cwd: ROOT,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32' // Use shell on Windows for better process handling
  })

  p.stdout?.on('data', d => {
    process.stdout.write(`[go:${port}] ` + d.toString())
  })
  p.stderr?.on('data', d => {
    process.stderr.write(`[go:${port}] ` + d.toString())
  })

  p.on('error', (err) => {
    console.error(`Failed to start Go server on port ${port}:`, err)
  })

  return p
}

async function waitForServer(port: string, timeout = 15000) {
  const url = `/session`
  const start = Date.now()
  console.log(`Waiting for server on port ${port} to be ready...`)

  while (Date.now() - start < timeout) {
    try {
      const res = await new Promise<number>((resolve) => {
        const req = http.get({
          hostname: 'localhost',
          port: Number(port),
          path: url,
          timeout: 3000
        }, r => {
          resolve(r.statusCode || 0)
        })
        req.on('error', () => resolve(0))
        req.on('timeout', () => {
          req.destroy()
          resolve(0)
        })
      })
      if (res === 200 || res === 429) {
        console.log(`Server on port ${port} is ready (status: ${res})`)
        return
      }
    } catch (e) {
      // ignore
    }
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error(`Server did not become ready on port ${port} within ${timeout}ms`)
}

export default async function globalSetup() {
  console.log('Starting global setup...')

  try {
    // Start primary mock server on 8080 (no rate limiting)
    const primary = startGoServer('8080', 'mock', '')

    // Start secondary server on 8081 with rate limiting enabled for rate limit tests
    const secondary = startGoServer('8081', 'mock', 'true')

    // Wait for both to be ready
    await waitForServer('8080')
    await waitForServer('8081')

    console.log('Both servers are ready')

    // Save PIDs so teardown can kill them
    const data = { pids: [primary.pid, secondary.pid].filter(Boolean) }
    return data
  } catch (error) {
    console.error('Global setup failed:', error)
    throw error
  }
}
