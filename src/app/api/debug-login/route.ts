import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: Request) {
  const results: any = { steps: [], timestamp: new Date().toISOString() }
  
  try {
    const body = await req.json()
    const { email, name, image, provider, providerAccountId } = body
    
    results.input = { email, name, provider, providerAccountId }

    // Step 1: Check if user exists by email
    const { data: existingUser, error: findError } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .single()
    
    if (findError && findError.code !== 'PGRST116') {
      results.steps.push({ step: '1_find_user', status: 'error', error: findError.message, code: findError.code })
      return NextResponse.json(results)
    }
    
    results.steps.push({ 
      step: '1_find_user', 
      status: existingUser ? 'found' : 'not_found',
    })

    let userId: string

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Step 2: Create user
      const ts = new Date().toISOString()
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert({
          email,
          name: name || null,
          image: image || null,
          createdAt: ts,
          updatedAt: ts,
        })
        .select()
        .single()
      
      if (createError) {
        results.steps.push({ step: '2_create_user', status: 'error', error: createError.message, code: createError.code })
        return NextResponse.json(results)
      }
      
      results.steps.push({ step: '2_create_user', status: 'success', userId: newUser.id })
      userId = newUser.id
    }

    // Step 3: Link account
    const { data: existingAccount } = await supabase
      .from('Account')
      .select('id')
      .eq('provider', provider)
      .eq('providerAccountId', providerAccountId)
      .single()

    if (!existingAccount) {
      const { error: linkError } = await supabase
        .from('Account')
        .insert({
          userId,
          type: 'oauth',
          provider,
          providerAccountId,
        })
      
      if (linkError) {
        results.steps.push({ step: '3_link_account', status: 'error', error: linkError.message, code: linkError.code })
        return NextResponse.json(results)
      }
      results.steps.push({ step: '3_link_account', status: 'success' })
    } else {
      results.steps.push({ step: '3_link_account', status: 'already_exists' })
    }

    // Step 4: Check membership
    const { data: membership } = await supabase
      .from('TeamMembership')
      .select('*, team!inner(*)')
      .eq('userId', userId)
      .eq('status', 'ACTIVO')
      .single()
    
    results.steps.push({ 
      step: '4_find_membership', 
      status: membership ? 'found' : 'not_found',
    })

    if (!membership) {
      // Step 5: Count users
      const { count } = await supabase
        .from('User')
        .select('*', { count: 'exact', head: true })
      
      results.steps.push({ step: '5_count_users', status: 'success', count })

      if (count === 1) {
        // Step 6: Create Team
        const ts = new Date().toISOString()
        const { data: team, error: teamError } = await supabase
          .from('Team')
          .insert({
            name: 'Mi Equipo',
            shortName: 'MEQ',
            category: 'Por configurar',
            coachName: name || 'Entrenador',
            foundedYear: new Date().getFullYear(),
            onboardingCompleted: false,
            isActive: true,
            createdAt: ts,
            updatedAt: ts,
          })
          .select()
          .single()
        
        if (teamError) {
          results.steps.push({ step: '6_create_team', status: 'error', error: teamError.message, code: teamError.code })
          return NextResponse.json(results)
        }
        
        results.steps.push({ step: '6_create_team', status: 'success', teamId: team.id })

        // Step 7: Create membership ADMIN
        const { error: memCreateError } = await supabase
          .from('TeamMembership')
          .insert({
            userId,
            teamId: team.id,
            role: 'ADMIN',
            status: 'ACTIVO',
            joinedAt: new Date().toISOString(),
          })
        
        if (memCreateError) {
          results.steps.push({ step: '7_create_membership', status: 'error', error: memCreateError.message, code: memCreateError.code })
          return NextResponse.json(results)
        }
        
        results.steps.push({ step: '7_create_membership', status: 'success' })
      }
    }

    results.success = true
    results.userId = userId
    return NextResponse.json(results)
  } catch (e: any) {
    results.fatalError = e.message
    return NextResponse.json(results, { status: 500 })
  }
}
