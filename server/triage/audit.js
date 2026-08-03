import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOG_DIR = path.join(__dirname, '..', '..', 'data', 'audit')
const LOG_FILE = path.join(LOG_DIR, 'triage-audit.jsonl')

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }
}

/**
 * Append one audit event (JSON Lines).
 * @returns {string} auditId
 */
export function appendAuditEvent(event) {
  ensureLogDir()
  const auditId = randomUUID()
  const row = {
    id: auditId,
    at: new Date().toISOString(),
    ...event,
  }
  fs.appendFileSync(LOG_FILE, `${JSON.stringify(row)}\n`, 'utf8')
  return auditId
}

export function getAuditLogPath() {
  return LOG_FILE
}
