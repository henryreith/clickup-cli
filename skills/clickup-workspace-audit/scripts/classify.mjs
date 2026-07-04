#!/usr/bin/env node
// Deterministic hygiene classification. Pipe `clickup task search ... --format json`
// into this script; every task is bucketed by rule, not judgment.
//
//   clickup task search --workspace-id X --format json | node scripts/classify.mjs
//
// Output: JSON buckets (overdue, unassigned, noDueDate, stale, load) plus counts.
// --stale-days <n> overrides the 14-day staleness window.

import { readFileSync } from 'node:fs'

const staleIdx = process.argv.indexOf('--stale-days')
const STALE_DAYS = staleIdx !== -1 ? Number(process.argv[staleIdx + 1]) : 14
const now = Date.now()
const staleCutoff = now - STALE_DAYS * 24 * 3_600_000

const raw = readFileSync(0, 'utf-8')
let tasks = JSON.parse(raw)
if (!Array.isArray(tasks)) tasks = tasks.tasks ?? [tasks]

const summarize = (t) => ({
  id: t.id,
  name: t.name,
  status: typeof t.status === 'object' ? t.status?.status : t.status,
  assignees: (t.assignees ?? []).map((a) => a.username ?? a.id),
  due_date: t.due_date ? new Date(Number(t.due_date)).toISOString().slice(0, 10) : null,
  list: t.list?.name ?? null,
})

const buckets = { overdue: [], unassigned: [], noDueDate: [], stale: [] }
const load = {}
const isClosed = (t) => {
  const type = typeof t.status === 'object' ? t.status?.type : undefined
  const s = (typeof t.status === 'object' ? t.status?.status : t.status ?? '').toLowerCase()
  return type === 'closed' || type === 'done' || ['closed', 'complete', 'done'].includes(s)
}

let active = 0
for (const t of tasks) {
  if (isClosed(t)) continue
  active++
  const s = summarize(t)
  for (const a of s.assignees) load[a] = (load[a] ?? 0) + 1

  if (s.assignees.length === 0) buckets.unassigned.push(s)
  if (!t.due_date) buckets.noDueDate.push(s)
  else if (Number(t.due_date) < now) buckets.overdue.push(s)

  const statusType = typeof t.status === 'object' ? t.status?.type : undefined
  const updated = Number(t.date_updated)
  if (statusType === 'custom' || /progress|review|doing/.test((s.status ?? '').toLowerCase())) {
    if (updated && updated < staleCutoff) buckets.stale.push({ ...s, last_updated: new Date(updated).toISOString().slice(0, 10) })
  }
}

buckets.overdue.sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
const flagged = new Set([...buckets.overdue, ...buckets.unassigned, ...buckets.noDueDate, ...buckets.stale].map((t) => t.id))

process.stdout.write(
  JSON.stringify(
    {
      activeTasks: active,
      flaggedTasks: flagged.size,
      staleDays: STALE_DAYS,
      counts: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length])),
      load: Object.fromEntries(Object.entries(load).sort((a, b) => b[1] - a[1])),
      ...buckets,
    },
    null,
    2,
  ) + '\n',
)
