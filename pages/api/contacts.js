import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { instanceId, search } = req.query;

    if (!process.env.SUPABASE_SERVICE_KEY) {
        console.error('SUPABASE_SERVICE_KEY is missing');
        return res.status(500).json({ error: 'Configuration error: Missing service key' });
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
            const searchTerm = `%${searchStr}%`;
            // Usar ilike para búsqueda insensible a mayúsculas
            query = query.or(`name.ilike.${searchTerm},push_name.ilike.${searchTerm},jid.ilike.${searchTerm}`);
        }

        // Ejecutar consulta
        const { data: contacts, error } = await query
            .order('name', { ascending: true, nullsFirst: false })
            .limit(50);

        if (error) {
            console.error('Supabase error fetching contacts:', error);
            return res.status(500).json({ error: error.message, details: error });
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
        console.error('Unexpected error in contacts API:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
