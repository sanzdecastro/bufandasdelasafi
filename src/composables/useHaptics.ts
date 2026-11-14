// Respuesta háptica ligera («tic») para los carriles de opciones.
//
// - Android (Chrome, Samsung Internet, Firefox): Vibration API.
// - iOS 18+ (Safari y cualquier navegador en iPhone): no hay API oficial. Truco: al cambiar
//   un `<input type="checkbox" switch>` el sistema hace un toque háptico. Se dispara con
//   label.click() sobre un interruptor oculto. Apple solo lo respeta cerca de un gesto del
//   usuario, así que durante la inercia del scroll puede no notarse. No es fiable.
// - Escritorio y el resto: no hace nada.

const MIN_INTERVAL_MS = 45

let last = 0
let iosLabel: HTMLLabelElement | null = null

const isIOS =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS se presenta como «Macintosh»; se distingue por la pantalla táctil
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1))

function getIOSSwitch(): HTMLLabelElement {
  if (iosLabel) return iosLabel
  const label = document.createElement('label')
  label.setAttribute('aria-hidden', 'true')
  label.style.cssText =
    'position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;left:-9999px'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  input.tabIndex = -1
  label.appendChild(input)
  document.body.appendChild(label)
  iosLabel = label
  return label
}

/** Un «tic» háptico corto. Limitado a uno cada 45 ms. */
export function hapticTick(): void {
  const now = performance.now()
  if (now - last < MIN_INTERVAL_MS) return
  last = now

  if (typeof navigator.vibrate === 'function' && !isIOS) {
    try {
      navigator.vibrate(8)
    } catch {
      /* sin permiso (aún no ha habido interacción): no pasa nada */
    }
    return
  }

  if (isIOS) getIOSSwitch().click()
}
