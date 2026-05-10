import PostalMime from 'postal-mime';

/**
 * Cloudflare Email Worker — vowfolio.com inbound email handler
 *
 * Mottar e-poster sendt til thread-<uuid>@vowfolio.com (svar fra klienter)
 * og lagrer dem som meldinger i Supabase-databasen.
 *
 * Miljøvariabler (sett via `wrangler secret put`):
 *   SUPABASE_URL             – f.eks. https://ubdqueuknaqegipnbsxc.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY – service role key (omgår RLS)
 */

export default {
  async email(message, env, ctx) {
    // 1. Parse thread-ID fra To-adressen
    const toAddress = message.to || '';
    const match = toAddress.match(/thread-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})@vowfolio\.com/i);

    if (!match) {
      // Ikke en tråd-svar-adresse — ignorer
      console.log(`Ignoring email to: ${toAddress}`);
      return;
    }

    const threadId = match[1].toLowerCase();

    // 2. Parse e-posten (hent avsendernavn og ren tekst)
    const rawEmail = await new Response(message.raw).arrayBuffer();
    const parsed = await PostalMime.parse(rawEmail);

    const senderName = parsed.from?.name
      || parsed.from?.address?.split('@')[0]
      || 'Client';

    const rawBody = parsed.text || stripHtml(parsed.html || '');
    const body = stripQuotedContent(rawBody).trim();

    if (!body) {
      console.log(`Empty body after stripping quotes for thread ${threadId}`);
      return;
    }

    const headers = {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    };

    // 3. Hent tråd-info fra Supabase
    const threadRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/message_threads?id=eq.${threadId}&select=id,wedding_id,unread_count`,
      { headers }
    );

    if (!threadRes.ok) {
      console.error(`Failed to fetch thread: ${threadRes.status}`);
      return;
    }

    const threads = await threadRes.json();
    if (!threads.length) {
      console.error(`Thread not found: ${threadId}`);
      return;
    }

    const thread = threads[0];
    const now = new Date().toISOString();

    // 4. Sett inn ny melding (sender_id er nullable — klient har ingen auth-bruker)
    const msgPayload = {
      thread_id: threadId,
      sender_role: 'client',
      sender_name: senderName,
      body,
      ...(thread.wedding_id ? { wedding_id: thread.wedding_id } : {}),
    };

    const insertRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/messages`,
      {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify(msgPayload),
      }
    );

    if (!insertRes.ok) {
      const err = await insertRes.text();
      console.error(`Failed to insert message: ${insertRes.status} — ${err}`);
      return;
    }

    // 5. Oppdater tråden (preview + ulest-teller for fotograf)
    const preview = body.length > 80 ? body.slice(0, 80) + '…' : body;
    const newUnread = (thread.unread_count || 0) + 1;

    await fetch(
      `${env.SUPABASE_URL}/rest/v1/message_threads?id=eq.${threadId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          last_message_preview: preview,
          last_message_at: now,
          updated_at: now,
          unread_count: newUnread,
        }),
      }
    );

    console.log(`✓ Email reply from "${senderName}" saved to thread ${threadId}`);
  },
};

// --- Hjelpefunksjoner ---

/**
 * Fjerner sitert innhold fra e-postsvar.
 * Stopper ved første ">"-linje, "On ... wrote:"-linje, eller skillelinje.
 */
function stripQuotedContent(text) {
  const lines = text.split('\n');
  const result = [];

  for (const line of lines) {
    if (
      line.startsWith('>') ||
      /^On .{10,} wrote:?$/i.test(line.trim()) ||
      /^-{3,}/.test(line) ||
      /^_{3,}/.test(line) ||
      /^From:\s/i.test(line)
    ) {
      break;
    }
    result.push(line);
  }

  // Fjern tomme linjer på slutten
  while (result.length && !result[result.length - 1].trim()) {
    result.pop();
  }

  return result.join('\n');
}

/** Naiv HTML-til-tekst for fallback når plain text mangler */
function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}
