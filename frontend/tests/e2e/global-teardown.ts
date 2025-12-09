import { spawn } from 'child_process'

export default async function globalTeardown(data: any) {
  console.log('Starting global teardown...')

  if (!data || !data.pids) {
    console.log('No PIDs to clean up')
    return
  }

  for (const pid of data.pids) {
    if (!pid) continue

    try {
      console.log(`Terminating process ${pid}`)

      if (process.platform === 'win32') {
        // On Windows, use taskkill to ensure the process tree is killed
        const killProcess = spawn('taskkill', ['/pid', pid.toString(), '/t', '/f'], { stdio: 'ignore' })
        await new Promise((resolve) => {
          killProcess.on('close', resolve)
          setTimeout(resolve, 5000) // timeout after 5 seconds
        })
      } else {
        // On Unix-like systems, use SIGTERM first, then SIGKILL if needed
        process.kill(pid, 'SIGTERM')

        // Wait a bit and then force kill if still running
        setTimeout(() => {
          try {
            process.kill(pid, 'SIGKILL')
          } catch (e) {
            // Process might already be dead
          }
        }, 2000)
      }
    } catch (e) {
      console.error(`Failed to kill process ${pid}:`, e)
    }
  }

  console.log('Global teardown complete')
}

