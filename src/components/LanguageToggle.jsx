import { useLocale } from '../lib/LocaleProvider'
import { cn } from '../lib/utils'

export default function LanguageToggle({ className }) {
  const { locale, setLocale, locales, t } = useLocale()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-obsidian/12 bg-paper/80 p-0.5',
        className
      )}
      role="group"
      aria-label={t('language')}
    >
      {locales.map((item) => (
        <button
          key={item.code}
          type="button"
          onClick={() => setLocale(item.code)}
          className={cn(
            'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition',
            locale === item.code
              ? 'bg-obsidian text-paper'
              : 'text-obsidian/50 hover:text-obsidian'
          )}
          title={item.label}
        >
          {item.short}
        </button>
      ))}
    </div>
  )
}
