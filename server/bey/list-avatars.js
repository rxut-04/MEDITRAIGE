/**
 * One-shot helper: list Beyond Presence avatars to verify BEYOND_PRESENCE_AVATAR_ID.
 * Usage: node server/bey/list-avatars.js
 */
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { listAvatars } from './client.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

const avatars = await listAvatars(20)
console.log(JSON.stringify(avatars, null, 2))
if (!avatars.length) {
  console.log('No avatars returned — check BEYOND_PRESENCE_API_KEY.')
}
