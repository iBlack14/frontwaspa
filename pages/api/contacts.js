import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { instanceId } = req.query;

    if (!instanceId) {
        return res.status(400).json({ error: 'instanceId is required' });
    }

    try {
        // Obtener contactos de la instancia
        const { data: contacts, error } = await supabase
            .from('contacts')
            .select('jid, name, push_name, profile_pic_url, is_blocked')
            .eq('instance_id', instanceId)
            .eq('is_blocked', false)
            .order('name', { ascending: true, nullsFirst: false });

        if (error) {
            console.error('Error fetching contacts:', error);
            return res.status(500).json({ error: error.message });
        }

        // Formatear contactos
        const formattedContacts = contacts.map(contact => ({
            jid: contact.jid,
            name: contact.name || contact.push_name || contact.jid.split('@')[0],
            pushName: contact.push_name,
            profilePicUrl: contact.profile_pic_url,
        }));

        return res.status(200).json({ contacts: formattedContacts });
    } catch (error) {
        console.error('Error in contacts API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
