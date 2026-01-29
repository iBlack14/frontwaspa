import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { email, password, username } = req.body

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing fields' })
    }

    // Initialize Supabase Admin client
    // Note: This requires SUPABASE_SERVICE_ROLE_KEY to be set in environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase environment variables')
        return res.status(500).json({ error: 'Server configuration error' })
    }

    const supabaseAdmin = createClient(
        supabaseUrl,
        supabaseServiceKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    try {
        // Create user with auto-confirm
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { username }
        })

        if (error) throw error

        return res.status(200).json({
            message: 'User created successfully',
            user: data.user
        })

    } catch (error: any) {
        console.error('Registration error:', error)
        return res.status(500).json({ error: error.message })
    }
}
