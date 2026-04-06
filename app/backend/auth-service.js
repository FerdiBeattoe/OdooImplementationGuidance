import supabase from './supabase-client.js'

const NOT_CONFIGURED = 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'

export async function createAccount(fullName, email, password, companyName) {
  if (!supabase) return { user: null, session: null, error: NOT_CONFIGURED }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return { user: null, session: null, error: authError.message }
  }

  const { error: profileError } = await supabase
    .from('accounts')
    .insert({ id: authData.user.id, full_name: fullName, company_name: companyName })

  if (profileError) {
    return { user: null, session: null, error: profileError.message }
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    return {
      user: authData.user,
      session: null,
      error: null,
      accountCreated: true,
      signInFailed: true,
    }
  }

  return { user: signInData.user, session: signInData.session, error: null }
}

export async function signIn(email, password) {
  if (!supabase) return { user: null, session: null, error: NOT_CONFIGURED }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { user: null, session: null, error: error.message }
  }
  return { user: data.user, session: data.session, error: null }
}

export async function verifyToken(jwt) {
  if (!supabase) return { user: null, error: NOT_CONFIGURED }

  const { data, error } = await supabase.auth.getUser(jwt)
  if (error) {
    return { user: null, error: error.message }
  }
  return { user: data.user, error: null }
}

export async function createProject(accountId, projectId, odooUrl, odooDatabase) {
  if (!supabase) return { project: null, error: NOT_CONFIGURED }

  const { data, error } = await supabase
    .from('projects')
    .insert({ id: projectId, account_id: accountId, odoo_url: odooUrl, odoo_database: odooDatabase })
    .select()
    .single()

  if (error) {
    return { project: null, error: error.message }
  }
  return { project: data, error: null }
}

export async function getAccountProjects(accountId) {
  if (!supabase) return { projects: [], error: null }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('account_id', accountId)

  if (error) {
    return { projects: null, error: error.message }
  }
  return { projects: data, error: null }
}
