// Desplazamiento horizontal en escritorio para carriles con la barra de scroll oculta:
// - Arrastrar con el ratón (cursor de mano). Un arrastre no cuenta como clic en la opción.
// - La rueda vertical del ratón desplaza en horizontal.
// - Con `snap`, al soltar se alinea suave a la opción más cercana (como el snap táctil).
// En pantallas táctiles no hace nada: ahí ya funciona el scroll nativo.

import { onBeforeUnmount, onMounted, type Ref } from 'vue'

const DRAG_THRESHOLD = 4

export function useDragScroll(target: Ref<HTMLElement | null>, options: { snap?: boolean } = {}) {
  let el: HTMLElement | null = null
  let pointerId: number | null = null
  let startX = 0
  let startScroll = 0
  let dragged = false
  let restoreTimer = 0

  /** Posición de scroll de la opción más cercana a la actual */
  function nearestSnap(): number {
    if (!el) return 0
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0
    const max = el.scrollWidth - el.clientWidth
    let best = el.scrollLeft
    let bestDist = Infinity
    for (const child of Array.from(el.children) as HTMLElement[]) {
      const pos = Math.min(max, Math.max(0, child.offsetLeft - pad))
      const dist = Math.abs(pos - el.scrollLeft)
      if (dist < bestDist) {
        bestDist = dist
        best = pos
      }
    }
    return best
  }

  function onPointerDown(e: PointerEvent) {
    if (!el || e.pointerType !== 'mouse' || e.button !== 0) return
    if (el.scrollWidth <= el.clientWidth) return
    pointerId = e.pointerId
    startX = e.clientX
    startScroll = el.scrollLeft
    dragged = false
  }

  function onPointerMove(e: PointerEvent) {
    if (!el || e.pointerId !== pointerId) return
    const dx = e.clientX - startX
    if (!dragged) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return
      dragged = true
      el.setPointerCapture(e.pointerId)
      el.classList.add('is-dragging')
      // Durante el arrastre, sin snap: el carril sigue al ratón
      el.style.scrollSnapType = 'none'
      clearTimeout(restoreTimer)
    }
    el.scrollLeft = startScroll - dx
  }

  function onPointerUp(e: PointerEvent) {
    if (!el || e.pointerId !== pointerId) return
    pointerId = null
    if (!dragged) return
    el.classList.remove('is-dragging')
    if (options.snap) {
      el.scrollTo({ left: nearestSnap(), behavior: 'smooth' })
      // Se devuelve el snap del CSS cuando ha terminado de colocarse
      restoreTimer = window.setTimeout(() => el && (el.style.scrollSnapType = ''), 450)
    } else {
      el.style.scrollSnapType = ''
    }
  }

  /** Tras un arrastre, el clic que dispara el navegador al soltar no selecciona nada */
  function onClickCapture(e: MouseEvent) {
    if (!dragged) return
    e.preventDefault()
    e.stopPropagation()
    dragged = false
  }

  /** Rueda vertical → desplazamiento horizontal (la página no tiene scroll vertical) */
  function onWheel(e: WheelEvent) {
    if (!el || el.scrollWidth <= el.clientWidth) return
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return // trackpad horizontal: nativo
    e.preventDefault()
    el.scrollBy({ left: e.deltaY })
  }

  onMounted(() => {
    el = target.value
    if (!el) return
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    el.addEventListener('click', onClickCapture, true)
    el.addEventListener('wheel', onWheel, { passive: false })
  })

  onBeforeUnmount(() => {
    clearTimeout(restoreTimer)
    if (!el) return
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerup', onPointerUp)
    el.removeEventListener('pointercancel', onPointerUp)
    el.removeEventListener('click', onClickCapture, true)
    el.removeEventListener('wheel', onWheel)
  })
}
