import { useToastStore } from '../store/useToastStore'

const KIND_CLASSES = {
  success: 'border-accent-green/50 text-accent-green',
  error: 'border-accent-red/50 text-accent-red',
  info: 'border-accent-blue/50 text-accent-blue',
}

/** Bottom-center toast stack — sits above the mobile tab bar. */
export default function Toasts() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[76px] z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`card pointer-events-auto max-w-full truncate border px-4 py-2.5 text-sm
            font-semibold ${KIND_CLASSES[t.kind]}`}
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}
