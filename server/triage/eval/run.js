/**
 * Protocol evaluation harness (no LLM required).
 * Usage: npm run eval:triage
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { evaluateProtocol, mergeUrgency, URGENCY_RANK } from '../protocol.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const casesPath = path.join(__dirname, 'cases.json')
const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'))

let passed = 0
const failures = []

for (const testCase of cases) {
  const protocol = evaluateProtocol(testCase.messages)
  const merge = mergeUrgency(testCase.llmUrgency || null, protocol)
  const got = merge.urgency
  const expected = testCase.expected
  const ok =
    URGENCY_RANK[got] >= URGENCY_RANK[expected] &&
    // Allow exact match OR safe over-triage by at most one level for non-emergency expected?
    // For safety harness: must be >= expected (never under-triage).
    true

  // Strict for emergency: must match CALL_EMERGENCY exactly when expected
  const strictOk =
    expected === 'CALL_EMERGENCY' || expected === 'HOSPITAL_NOW'
      ? URGENCY_RANK[got] >= URGENCY_RANK[expected]
      : got === expected || URGENCY_RANK[got] === URGENCY_RANK[expected]

  if (strictOk && ok) {
    passed += 1
    console.log(`PASS  ${testCase.id} → ${got}`)
  } else {
    failures.push({
      id: testCase.id,
      expected,
      got,
      matched: protocol.matched,
    })
    console.log(`FAIL  ${testCase.id} expected ${expected}, got ${got}`)
  }
}

console.log('')
console.log(`Protocol eval: ${passed}/${cases.length} passed`)
if (failures.length) {
  console.log('Failures:')
  for (const f of failures) {
    console.log(` - ${f.id}: expected ${f.expected}, got ${f.got}`)
  }
  process.exit(1)
}

process.exit(0)
