import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useParams } from 'react-router-dom'
import { BRAND } from '../constants'
import { fetchOrgBySlug } from './clinicStore'

const BrandContext = createContext({
  brand: {
    name: BRAND.name,
    tagline: BRAND.tagline,
    primaryColor: '#0f766e',
    logoUrl: null,
    disclaimer: null,
    slug: null,
  },
  loading: false,
})

export function BrandProvider({ children, slug: slugProp }) {
  const params = useParams()
  const slug = slugProp || params.slug || null
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(Boolean(slug))

  useEffect(() => {
    if (!slug) {
      setOrg(null)
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    fetchOrgBySlug(slug)
      .then((data) => {
        if (active) setOrg(data)
      })
      .catch(() => {
        if (active) setOrg(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [slug])

  useEffect(() => {
    if (!org?.primary_color) {
      document.documentElement.style.removeProperty('--brand-primary')
      return
    }
    document.documentElement.style.setProperty(
      '--brand-primary',
      org.primary_color
    )
  }, [org?.primary_color])

  const value = useMemo(() => {
    if (!org) {
      return {
        brand: {
          name: BRAND.name,
          tagline: BRAND.tagline,
          primaryColor: '#0f766e',
          logoUrl: null,
          disclaimer: null,
          slug: null,
        },
        loading,
      }
    }
    return {
      brand: {
        name: org.name || BRAND.name,
        tagline: org.tagline || BRAND.tagline,
        primaryColor: org.primary_color || '#0f766e',
        logoUrl: org.logo_url,
        disclaimer: org.disclaimer,
        slug: org.slug,
        id: org.id,
      },
      loading,
    }
  }, [org, loading])

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  )
}

export function useBrand() {
  return useContext(BrandContext)
}
