---
name: clickup-my-day
description: Builds a personal daily agenda from ClickUp showing what is due, overdue, in progress, and blocked, ordered by what to tackle first. Use when the user asks what they should work on, wants their day planned, or asks what is on their plate today.
license: MIT
disable-model-invocation: true
context: fork
agent: general-purpose
argument-hint: "[optional: a different person, or 'this week' for a wider window]"
allowed-tools: Bash(clickup *)
---

# My Day

Answer one question well: what should I work on right now?

## Understanding the Scope

Default subject is the authenticated user; `$ARGUMENTS` can name someone else or widen the window ("this week"). Resolve the current user by matching the email from `clickup auth status` against `clickup member list --format json`.

## Workflow

### Step 1: Pull my open tasks

```bash
clickup task search --workspace-id <id> --assignee <user-id> --format json
```

### Step 2: Check the running timer

```bash
clickup time running --workspace-id <id> --format json
```

If a timer is running, its task leads the agenda ("you're mid-flight on this").

### Step 3: Bucket and order

1. **Overdue** - `due_date` in the past (oldest first)
2. **Due today**
3. **In progress** - started but not due yet; flag anything untouched for 7+ days
4. **Blocked/waiting** - list what each is waiting on if dependencies exist
5. **Up next** - highest priority undated tasks, max 3

Priority (urgent=1 to low=4) breaks ties inside each bucket.

### Step 4: Present the agenda

```
## Your day - <date>

Now: <running timer task, if any>

1. [OVERDUE] <task> - was due <date> (<list>)
2. [TODAY] <task> - <priority>
3. ...

Blocked (not actionable): <task> - waiting on <dependency>

Suggestion: <one sentence - e.g. "Clear the two overdue items before starting new work.">
```

Keep it under ~10 items; summarize the rest as "and N more in the backlog".

### Step 5: Offer actions

If the user reacts ("push the report to Friday", "start the timer on #2"):

```bash
clickup task update <id> --due-date friday
clickup time start --workspace-id <id> --task-id <id>
```

## Tips

- Dates accept relative forms (`friday`, `+2d`) so rescheduling reads naturally.
- "This week" widens step 3's due window to the next 7 days but keeps the same buckets.
- For someone else's day, skip step 5's timer actions - never start timers for other people.
