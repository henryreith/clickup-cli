#!/usr/bin/env node
// Deterministic timesheet aggregation. Pipe `clickup time list ... --format json`
// into this script; totals come out exact so no arithmetic is done by the agent.
//
//   clickup time list --workspace-id X --start -7d --end today --format json \
//     | node scripts/aggregate.mjs [--csv]
//
// Default output: JSON summary (totals, byPerson, byTask, flags).
// --csv: timesheet rows (date,person,task,description,hours,billable) on stdout.

import { readFileSync } from 'node:fs'

const wantCsv = process.argv.includes('--csv')
const raw = readFileSync(0, 'utf-8')
let entries = JSON.parse(raw)
if (!Array.isArray(entries)) entries = entries.data ?? [entries]

const MS_PER_HOUR = 3_600_000
const hours = (ms) => Math.round((ms / MS_PER_HOUR) * 100) / 100
const rows = []
const flags = { runningTimers: [], noTask: [], over12h: [] }
const byPerson = {}
const byTask = {}
let totalMs = 0
let billableMs = 0

for (const e of entries) {
  const duration = Number(e.duration)
  const person = e.user_name || e.user?.username || 'unknown'
  const task = e.task?.name || e.task_id || e.task?.id || ''
  const desc = e.description || ''
  const billable = e.billable === true || e.billable === 'true'

  if (!e.end || duration < 0) {
    flags.runningTimers.push({ id: e.id, person, task })
    continue
  }
  if (!task) flags.noTask.push({ id: e.id, person, hours: hours(duration) })
  if (duration > 12 * MS_PER_HOUR) flags.over12h.push({ id: e.id, person, task, hours: hours(duration) })

  totalMs += duration
  if (billable) billableMs += duration
  byPerson[person] = (byPerson[person] ?? 0) + duration
  byTask[task || '(no task)'] = (byTask[task || '(no task)'] ?? 0) + duration

  const date = new Date(Number(e.start)).toISOString().slice(0, 10)
  rows.push({ date, person, task, desc, hours: hours(duration), billable })
}

if (wantCsv) {
  const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))
  process.stdout.write('date,person,task,description,hours,billable\n')
  for (const r of rows.sort((a, b) => a.date.localeCompare(b.date) || a.person.localeCompare(b.person))) {
    process.stdout.write([r.date, r.person, r.task, r.desc, r.hours.toFixed(2), r.billable].map(esc).join(',') + '\n')
  }
} else {
  const toHours = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, hours(v)]))
  process.stdout.write(
    JSON.stringify(
      {
        entries: rows.length,
        totalHours: hours(totalMs),
        billableHours: hours(billableMs),
        nonBillableHours: hours(totalMs - billableMs),
        byPerson: toHours(byPerson),
        byTask: toHours(byTask),
        flags,
      },
      null,
      2,
    ) + '\n',
  )
}
