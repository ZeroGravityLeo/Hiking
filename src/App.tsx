import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import { CookieConsentBanner } from '@/components/compliance/CookieConsentBanner'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider } from '@/hooks/useAuth'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { DesignSystemPage } from '@/pages/DesignSystemPage'
import { ExplorePage } from '@/pages/ExplorePage'
import { FeedPage } from '@/pages/FeedPage'
import { HomePage } from '@/pages/HomePage'
import { ImportExportPage } from '@/pages/ImportExportPage'
import { LoginPage } from '@/pages/LoginPage'
import { MapPage } from '@/pages/MapPage'
import { MissionsPage } from '@/pages/MissionsPage'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { SafetyPage } from '@/pages/SafetyPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TermsPage } from '@/pages/TermsPage'
import { TrackingPage } from '@/pages/TrackingPage'
import { TrailDetailPage } from '@/pages/TrailDetailPage'
import { WildlifePage } from '@/pages/WildlifePage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/trails/:slug" element={<TrailDetailPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/wildlife" element={<WildlifePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/import-export" element={<ImportExportPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/design-system" element={<DesignSystemPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
      <CookieConsentBanner />
      <Toaster closeButton position="bottom-center" richColors />
    </AuthProvider>
  )
}

export default App
