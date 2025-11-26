import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { instanceId, search } = req.query;

    // Validar URL de Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL is missing');
        return res.status(500).json({ error: 'Configuration error: Missing Supabase URL' });
    }

    // Intentar obtener la key de varias variables de entorno comunes
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseKey) {
        console.error('CRITICAL: Supabase key is missing in environment variables');
        return res.status(500).json({
            error: 'Configuration error',
            details: 'Supabase key is missing. Check SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY.'
        });
    }

    // Inicializar cliente
    let supabase;
    try {
        supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseKey
        );
    } catch (clientError) {
        console.error('Error initializing Supabase client:', clientError);
        return res.status(500).json({ error: 'Initialization error', details: clientError.message });
    }

    if (!instanceId) {
        return res.status(400).json({ error: 'instanceId is required' });
    }

    try {
        // Construir la consulta base
        let query = supabase
            .from('contacts')
            .select('jid, name, push_name, profile_pic_url, is_blocked')
            .eq('instance_id', instanceId)
            .eq('is_blocked', false);

        // Agregar filtro de búsqueda si existe
        if (search) {
            const searchStr = Array.isArray(search) ? search[0] : search;
            const safeSearch = searchStr.replace(/[,()]/g, '');
            const searchTerm = `%${safeSearch}%`;

            // Buscar por nombre, push_name o jid
            query = query.or(`name.ilike.${searchTerm},push_name.ilike.${searchTerm},jid.ilike.${searchTerm}`);
        }

        // Ejecutar consulta
        const { data: contacts, error } = await query
            .order('name', { ascending: true, nullsFirst: false })
            .limit(50);

        if (error) {
            console.error('Supabase query error:', error);
            return res.status(500).json({
                error: 'Database query failed',
                details: error.message,
                hint: error.hint
            });
        }

        // Formatear contactos
        const formattedContacts = (contacts || []).map(contact => ({
            jid: contact.jid,
            name: contact.name || contact.push_name || contact.jid.split('@')[0],
            pushName: contact.push_name,
            profilePicUrl: contact.profile_pic_url,
        }));

        return res.status(200).json({ contacts: formattedContacts });
    } catch (error) {
        console.error('Unexpected handler error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}
