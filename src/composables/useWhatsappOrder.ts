import { computed } from 'vue'
import { COPY } from '../data/copy'
import { useScarfConfig } from './useScarfConfig'

/** Número en formato internacional sin «+» ni espacios. Vacío → WhatsApp pide elegir contacto. */
const PHONE = String(
  import.meta.env.WHATSAPP_NUMBER ?? import.meta.env.VITE_WHATSAPP_NUMBER ?? '',
).replace(/\D/g, '')

export function useWhatsappOrder() {
  const { length, baseColor, fringeColor, price } = useScarfConfig()

  const message = computed(() => {
    const t = COPY.order
    return [
      t.greeting,
      `- ${t.length}: ${length.value.label}`,
      `- ${t.baseColor}: ${baseColor.value.name}`,
      `- ${t.fringe}: ${fringeColor.value ? fringeColor.value.name : t.noFringe}`,
      `- ${t.price}: ${price.value}€`,
    ].join('\n')
  })

  const url = computed(
    () => `https://wa.me/${PHONE}?text=${encodeURIComponent(message.value)}`,
  )

  return { message, url }
}
