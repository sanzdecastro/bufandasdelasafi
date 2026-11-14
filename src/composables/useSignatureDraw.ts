// Animación de «escritura» de la firma de Safi (SVG en línea exportado de Figma).
//
// Cada rasgo de la firma es una forma rellena (vectorizada de una imagen), así que no hay
// línea que trazar: el contorno del rasgo se usa como MÁSCARA con un trazo grueso que avanza
// y va descubriendo el relleno real. Se ve la firma rellena escribiéndose, sin contornos.
// Los rasgos se escriben de abajo arriba (la firma va en vertical).

const NS = 'http://www.w3.org/2000/svg'
let uid = 0

interface Stroke {
  pen: SVGPathElement
  length: number
  y: number
}

/** Oculta la firma y prepara las máscaras. Devuelve los rasgos en orden de escritura. */
function prepare(svgs: SVGSVGElement[]): Stroke[] {
  const strokes = svgs.flatMap((svg) => {
    const vb = svg.viewBox.baseVal
    return Array.from(svg.querySelectorAll<SVGGElement>('g[id^="Vector"]')).flatMap((g) => {
      const use = g.querySelector('use')
      const ref = use?.getAttribute('xlink:href') ?? use?.getAttribute('href')
      const d = ref ? svg.querySelector(ref)?.getAttribute('d') : null
      if (!d) return []

      // Máscara: el contorno con un trazo grueso (cubre todo el grosor del rasgo)
      const id = `safi-reveal-${uid++}`
      const mask = document.createElementNS(NS, 'mask')
      mask.id = id
      mask.setAttribute('maskUnits', 'userSpaceOnUse')
      mask.setAttribute('x', String(vb.x - 20))
      mask.setAttribute('y', String(vb.y - 20))
      mask.setAttribute('width', String(vb.width + 40))
      mask.setAttribute('height', String(vb.height + 40))
      const pen = document.createElementNS(NS, 'path')
      pen.setAttribute('d', d)
      pen.setAttribute('fill', 'none')
      pen.setAttribute('stroke', 'white')
      pen.setAttribute('stroke-width', '12')
      pen.setAttribute('stroke-linecap', 'round')
      pen.setAttribute('stroke-linejoin', 'round')
      mask.appendChild(pen)
      svg.appendChild(mask)

      // El rasgo real (relleno + su trazo) queda dentro de la máscara
      const wrap = document.createElementNS(NS, 'g')
      wrap.setAttribute('mask', `url(#${id})`)
      Array.from(g.children)
        .filter((c) => c.tagName !== 'mask')
        .forEach((c) => wrap.appendChild(c))
      g.appendChild(wrap)

      const length = pen.getTotalLength()
      pen.style.strokeDasharray = `${length}`
      pen.style.strokeDashoffset = `${length}`
      const box = g.getBoundingClientRect()
      return [{ pen, length, y: box.top + box.height / 2 }]
    })
  })
  return strokes.sort((a, b) => b.y - a.y)
}

/**
 * Escribe la firma en `durationMs`, repartido entre los rasgos según su longitud.
 * La preparación es síncrona: al llamarla, la firma desaparece en el mismo frame.
 */
export async function drawSignatureSvgs(
  svgs: SVGSVGElement[],
  durationMs: number,
  isCancelled: () => boolean = () => false,
  running: Animation[] = [],
): Promise<void> {
  const strokes = prepare(svgs)
  const total = strokes.reduce((sum, s) => sum + s.length, 0) || 1

  for (const s of strokes) {
    if (isCancelled()) break
    // El contorno da la vuelta al rasgo (ida por un borde y vuelta por el otro): con el trazo
    // grueso, el rasgo queda entero a mitad de recorrido, así que solo se anima esa mitad.
    const duration = Math.max(16, (durationMs * s.length) / total)
    const a = s.pen.animate(
      [{ strokeDashoffset: s.length }, { strokeDashoffset: s.length / 2 }],
      { duration, easing: 'linear', fill: 'forwards' },
    )
    running.push(a)
    await a.finished.catch(() => undefined)
    s.pen.style.strokeDashoffset = '0'
  }
  // Si se cancela a medias, la firma queda completa
  strokes.forEach((s) => (s.pen.style.strokeDashoffset = '0'))
}
