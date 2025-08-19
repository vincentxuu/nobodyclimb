'use client'
import React from 'react'
import ProfileContainer from '@/components/profile/ProfileContainer'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'

export default function ProfilePage() {
  return (
    <ProfilePageLayout>
      <ProfileContainer />
    </ProfilePageLayout>
  )
}
