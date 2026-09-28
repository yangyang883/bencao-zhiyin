import { DeviceNotices } from '@/components/device-notices'
import { BottomNav } from '@/components/bottom-nav'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <DeviceNotices />
      {children}
      <BottomNav />
    </div>
  )
}
