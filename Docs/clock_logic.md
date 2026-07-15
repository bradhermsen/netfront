# Game Manager Clock Logic (Canonical)

## Purpose
Use one consistent hockey time model across mobile, web, backend, and database writes.

## Canonical Rule
- Store and display elapsed time in period (count-up), never remaining clock time (count-down).

## Event Time Rules
1. Game clock may visually count down in UI.
2. At event capture (goal, penalty, shot, or any event), read current clock remaining as MM:SS.
3. Convert to elapsed time in period.
4. Auto-populate modal Time field with elapsed time.
5. Send elapsed time in API payloads.
6. Persist elapsed time to:
   - GameEvents.TimeInPeriod
   - GameGoals.TimeInPeriod
   - GamePenalties.TimeInPeriod
7. Render elapsed time in event feed and all summaries/charts/stats.

## Core Utility

### TypeScript (React Native / Web)
```ts
function parseClockToSeconds(mmss: string): number {
  const [mRaw, sRaw] = mmss.split(":");
  const m = Number(mRaw ?? 0);
  const s = Number(sRaw ?? 0);
  return Math.max(0, m * 60 + s);
}

function formatSecondsToClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function computeElapsedTime(periodLengthMinutes: number, clockRemaining: string): string {
  const periodSeconds = Math.max(0, periodLengthMinutes) * 60;
  const remainingSeconds = parseClockToSeconds(clockRemaining);
  const elapsedSeconds = Math.max(0, periodSeconds - remainingSeconds);
  return formatSecondsToClock(elapsedSeconds);
}
```

### Usage (Modal Auto-Populate)
```ts
const elapsed = computeElapsedTime(gameConfig.periodLengthMinutes, gameClockRemaining);
setModalTimeInPeriod(elapsed);
```

### Usage (Event Creation Payload)
```ts
const elapsed = computeElapsedTime(gameConfig.periodLengthMinutes, gameClockRemaining);

const gameEventPayload = {
  gameId,
  period,
  timeInPeriod: elapsed,
  eventType,
  // ...other fields
};

const gameGoalPayload = {
  gameId,
  eventId,
  period,
  timeInPeriod: elapsed,
  // ...goal fields
};

const gamePenaltyPayload = {
  gameId,
  eventId,
  period,
  timeInPeriod: elapsed,
  // ...penalty fields
};
```

## Backend Contract Requirement
- Backend endpoints for event/goal/penalty creation must treat incoming timeInPeriod as elapsed time.
- Do not convert elapsed back to remaining in backend write paths.

## Validation Checklist
- Modal opens with elapsed MM:SS.
- Event feed shows elapsed MM:SS.
- DB rows in GameEvents/GameGoals/GamePenalties store elapsed MM:SS.
- Summary and stat calculations use elapsed timeline order.
- No API payload sends remaining clock time.

## Notes
- This applies to all future Game Manager implementations and refactors.
- If overtime period length differs, pass the active period length to computeElapsedTime.
