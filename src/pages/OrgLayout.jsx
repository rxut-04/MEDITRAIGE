/**
 * White-label + clinic shell for /o/:slug/*
 */
import { Outlet } from 'react-router-dom'
import { BrandProvider } from '../lib/BrandProvider'

export default function OrgLayout() {
  return (
    <BrandProvider>
      <Outlet />
    </BrandProvider>
  )
}
