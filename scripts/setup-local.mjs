import { access, copyFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

async function exists(path) {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const envPath = join(rootDir, '.env')
const envExamplePath = join(rootDir, '.env.example')
const nodeModulesPath = join(rootDir, 'node_modules')

if (!(await exists(envPath))) {
  await copyFile(envExamplePath, envPath)
  console.log('Created .env from .env.example')
}

if (!(await exists(nodeModulesPath))) {
  run(npmCommand, ['install'])
}

console.log('')
console.log('Local setup is ready.')
console.log('Run npm run dev:local and open the Local URL printed by Vite, usually http://localhost:5173')
