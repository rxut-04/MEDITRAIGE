import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { LOCALES, normalizeLocale, t as translate } from './i18n'

const STORAGE_KEY = 'meditriage-locale'

const LocaleContext = createContext({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
  locales: LOCALES,
})

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try {
      return normalizeLocale(localStorage.getItem(STORAGE_KEY) || 'en')
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      // ignore
    }
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next) => {
    setLocaleState(normalizeLocale(next))
  }, [])

  const t = useCallback((key) => translate(locale, key), [locale])

  const value = useMemo(
    () => ({ locale, setLocale, t, locales: LOCALES }),
    [locale, setLocale, t]
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
