// Fires now, then again after `delayMs`, then every `everyMs` until stopped.
// Each repeat is scheduled from the last one, so a slow frame never bursts.
export const holdRepeat = (fire: () => void, delayMs: number, everyMs: number): (() => void) => {
  fire()
  let timer = setTimeout(function tick() {
    fire()
    timer = setTimeout(tick, everyMs)
  }, delayMs)
  return () => clearTimeout(timer)
}

// Button timing from the ODROID-SHOW2 controls.
export const REPEAT_DELAY_MS = 170 // hold left/right this long to auto-repeat
export const REPEAT_MS = 50 // then one step this often
export const DROP_MS = 40 // one soft-drop row this often while held
