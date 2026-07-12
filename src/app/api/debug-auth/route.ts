import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseSecretKey: !!process.env.SUPABASE_SECRET_KEY,
      hasSupabasePublishableKey: !!process.env.SUPABASE_PUBLISHABLE_KEY,
      hasNextauthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextauthUrl: process.env.NEXTAUTH_URL,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      nodeEnv: process.env.NODE_ENV,
    },
    tests: [],
  }

  // Test 1: Verificar conexión a Supabase REST API
  try {
    const { data, error } = await supabase
      .from('User')
      .select('id, email, name')
      .limit(5)

    if (error) {
      results.tests.push({
        label: 'Supabase REST API - User query',
        success: false,
        error: error.message,
        code: error.code,
      })
    } else {
      results.tests.push({
        label: 'Supabase REST API - User query',
        success: true,
        userCount: data?.length || 0,
        users: data,
      })
    }
  } catch (e: any) {
    results.tests.push({
      label: 'Supabase REST API - User query',
      success: false,
      error: e.message,
    })
  }

  // Test 2: Verificar tabla Account
  try {
    const { data, error } = await supabase
      .from('Account')
      .select('id, provider, userId')
      .limit(5)

    if (error) {
      results.tests.push({
        label: 'Supabase - Account query',
        success: false,
        error: error.message,
      })
    } else {
      results.tests.push({
        label: 'Supabase - Account query',
        success: true,
        accountCount: data?.length || 0,
        accounts: data,
      })
    }
  } catch (e: any) {
    results.tests.push({
      label: 'Supabase - Account query',
      success: false,
      error: e.message,
    })
  }

  // Test 3: Verificar tabla Team
  try {
    const { data, error } = await supabase
      .from('Team')
      .select('id, name, onboardingCompleted')
      .limit(5)

    if (error) {
      results.tests.push({
        label: 'Supabase - Team query',
        success: false,
        error: error.message,
      })
    } else {
      results.tests.push({
        label: 'Supabase - Team query',
        success: true,
        teamCount: data?.length || 0,
        teams: data,
      })
    }
  } catch (e: any) {
    results.tests.push({
      label: 'Supabase - Team query',
      success: false,
      error: e.message,
    })
  }

  // Test 4: Verificar tabla TeamMembership
  try {
    const { data, error } = await supabase
      .from('TeamMembership')
      .select('id, role, status, userId, teamId')
      .limit(5)

    if (error) {
      results.tests.push({
        label: 'Supabase - TeamMembership query',
        success: false,
        error: error.message,
      })
    } else {
      results.tests.push({
        label: 'Supabase - TeamMembership query',
        success: true,
        membershipCount: data?.length || 0,
        memberships: data,
      })
    }
  } catch (e: any) {
    results.tests.push({
      label: 'Supabase - TeamMembership query',
      success: false,
      error: e.message,
    })
  }

  // Test 5: Intentar crear un user de prueba (con timestamps explícitos)
  try {
    const testUserId = 'test-' + Date.now()
    const ts = new Date().toISOString()
    const { data, error } = await supabase
      .from('User')
      .insert({
        id: testUserId,
        email: `test-${Date.now()}@futapp.debug`,
        name: 'Test User Debug',
        createdAt: ts,
        updatedAt: ts,
      })
      .select()
      .single()

    if (error) {
      results.tests.push({
        label: 'Supabase - Insert test user',
        success: false,
        error: error.message,
        code: error.code,
      })
    } else {
      results.tests.push({
        label: 'Supabase - Insert test user',
        success: true,
        userId: data.id,
      })

      // Limpiar el user de prueba
      await supabase.from('User').delete().eq('id', testUserId)
    }
  } catch (e: any) {
    results.tests.push({
      label: 'Supabase - Insert test user',
      success: false,
      error: e.message,
    })
  }

  return NextResponse.json(results, { status: 200 })
}
