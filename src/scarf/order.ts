// El pedido en la URL: /p?l=90&b=7285&f=7928  (f=0 → sin flecos)
// Lo usan la web (para generar el enlace del mensaje y para abrir un pedido compartido)
// y las funciones de Vercel (imagen y página con vista previa para WhatsApp).
//
// Los imports relativos llevan «.js»: las funciones de Vercel se ejecutan como ESM sin
// empaquetar y Node lo exige. Vite y TypeScript lo resuelven al fichero .ts.

import { findColor, LENGTHS } from '../data/options.js'

export interface OrderParams {
  lengthId: string
  baseColorId: string
  /** null = sin flecos */
  fringeColorId: string | null
}

const NO_FRINGE = '0'

export function orderQuery(o: OrderParams): string {
  const q = new URLSearchParams({
    l: o.lengthId,
    b: o.baseColorId,
    f: o.fringeColorId ?? NO_FRINGE,
  })
  return q.toString()
}

/** Pedido válido a partir de la URL, o null si falta algo o no existe */
export function parseOrder(params: URLSearchParams): OrderParams | null {
  const lengthId = params.get('l') ?? ''
  const baseColorId = params.get('b') ?? ''
  const f = params.get('f') ?? ''
  if (!LENGTHS.some((l) => l.id === lengthId)) return null
  if (!findColor(baseColorId)) return null
  if (f !== NO_FRINGE && !findColor(f)) return null
  return { lengthId, baseColorId, fringeColorId: f === NO_FRINGE ? null : f }
}
