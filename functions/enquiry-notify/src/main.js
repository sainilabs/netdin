/**
 * Netdin — enquiry notifier
 *
 * Trigger: tablesdb.netdin.tables.enquiries.rows.*.create
 *
 * Sends two emails when a brief is submitted:
 *   1. the full brief to the team, so a lead never sits unseen in the console
 *   2. an acknowledgement to the person who submitted it, so they know it worked
 *
 * The two sends are independent. A bouncing lead address must not stop the
 * team notification, and a failed team notification must not stop the
 * acknowledgement. Both outcomes are reported in the execution logs.
 *
 * No npm dependencies: Node 22 has global fetch.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

/** Env vars, all required except REPLY_TO. */
function readConfig() {
  const cfg = {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.MAIL_FROM,
    notifyTo: process.env.NOTIFY_TO,
    replyTo: process.env.MAIL_REPLY_TO || process.env.NOTIFY_TO,
    consoleBase: process.env.CONSOLE_BASE_URL || 'https://appwrite.io',
    projectId: process.env.APPWRITE_FUNCTION_PROJECT_ID || '',
  }
  const missing = Object.entries({
    RESEND_API_KEY: cfg.apiKey,
    MAIL_FROM: cfg.from,
    NOTIFY_TO: cfg.notifyTo,
  })
    .filter(([, v]) => !v)
    .map(([k]) => k)

  return { cfg, missing }
}

/** The event payload is the row. Accept a parsed object or a JSON string. */
function readRow(body) {
  if (!body) return null
  if (typeof body === 'object') return body
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

/**
 * Build the console link to the rows list.
 *
 * The event name carries the database and table IDs, so the URL needs no extra
 * configuration. Format:
 *   tablesdb.<databaseId>.tables.<tableId>.rows.<rowId>.create
 *
 * Verified console URL shape:
 *   https://appwrite.io/projects/<projectId>/databases/tablesdb/<databaseId>/tables/<tableId>/rows
 */
function consoleRowsUrl({ consoleBase, projectId }, event) {
  if (!projectId || typeof event !== 'string') return ''
  const parts = event.split('.')
  const databaseId = parts[0] === 'tablesdb' ? parts[1] : null
  const tableId = parts[2] === 'tables' ? parts[3] : null
  if (!databaseId || !tableId || databaseId === '*' || tableId === '*') return ''
  return `${consoleBase}/projects/${projectId}/databases/tablesdb/${databaseId}/tables/${tableId}/rows`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Plain-text brief. Kept plain so it is readable on a phone lock screen. */
function teamBody(row, consoleUrl) {
  const services = Array.isArray(row.services) ? row.services.join(', ') : String(row.services ?? '')
  return [
    '===========================================================',
    ' NEW BRIEF',
    '===========================================================',
    '',
    `  Name       ${row.name}`,
    `  Email      ${row.email}`,
    `  Company    ${row.company || '(not given)'}`,
    `  Services   ${services}`,
    `  Budget     ${row.budget}`,
    `  Timeline   ${row.timeline}`,
    '',
    '  -----------------------------------------------------------',
    '',
    `  ${row.message}`,
    '',
    '===========================================================',
    '',
    `Source:    ${row.source || 'netdin.com'}`,
    `Submitted: ${row.$createdAt || '(unknown)'}`,
    `Row ID:    ${row.$id || '(unknown)'}`,
    consoleUrl ? `\nOpen in Appwrite: ${consoleUrl}` : '',
  ].join('\n')
}

/** Shared HTML wrapper: header band, content, footer. Both emails use this. */
function emailShell(bodyHtml, { eyebrow, heading }) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f0f1ec;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1a1a1a">
<div style="max-width:560px;margin:0 auto;padding:32px 16px">
<div style="background:#fafbf8;border:1px solid #e3e6de;border-radius:12px;overflow:hidden">
<div style="background:#1a2b21;padding:24px 32px">
<p style="margin:0 0 4px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8fae9a">${escapeHtml(eyebrow)}</p>
<h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:600">${escapeHtml(heading)}</h1>
</div>
<div style="padding:32px">
${bodyHtml}
</div>
<div style="padding:20px 32px;border-top:1px solid #e3e6de;background:#f4f5f0">
<p style="margin:0;font-size:13px;color:#6b7a70"><strong style="color:#2f6b4f">Netdin</strong> · <a href="https://netdin.com" style="color:#6b7a70;text-decoration:none">netdin.com</a></p>
</div>
</div>
</div>
</body></html>`
}

function briefTable(rows) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid #e3e6de;border-radius:8px;overflow:hidden">
${rows.map(([label, value], i) => `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#f7f8f4'}">
<td style="padding:10px 16px;font-size:13px;color:#6b7a70;white-space:nowrap;width:120px;vertical-align:top">${escapeHtml(label)}</td>
<td style="padding:10px 16px;font-size:14px;color:#1a1a1a">${value}</td>
</tr>`).join('')}
</table>`
}

/** First name only, from whatever the visitor typed into the form. */
function firstNameOf(row) {
  return String(row.name || '').trim().split(/\s+/)[0] || 'there'
}

function ackText(row) {
  const first = firstNameOf(row)
  const services = Array.isArray(row.services) ? row.services.join(', ') : String(row.services ?? '')
  return [
    `Hi ${first},`,
    '',
    'Thanks for sending your brief to Netdin. It reached us and one of us will',
    'read it properly and reply within one working day.',
    '',
    "Here's a copy of what you sent, for your records.",
    '',
    '===========================================================',
    ' YOUR BRIEF',
    '===========================================================',
    '',
    `  Company    ${row.company || '(not given)'}`,
    `  Services   ${services}`,
    `  Budget     ${row.budget}`,
    `  Timeline   ${row.timeline}`,
    '',
    '  -----------------------------------------------------------',
    '',
    `  ${row.message}`,
    '',
    '===========================================================',
    '',
    'If anything has changed, just reply to this email and it will land with',
    'the same people.',
    '',
    'Netdin',
    'https://netdin.com',
  ].join('\n')
}

function ackHtml(row) {
  const first = escapeHtml(firstNameOf(row))
  const services = escapeHtml(Array.isArray(row.services) ? row.services.join(', ') : String(row.services ?? ''))
  const message = escapeHtml(row.message).replaceAll('\n', '<br>')

  const body = `
<p style="margin:0 0 16px;font-size:15px;line-height:1.6">Hi ${first},</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6">Thanks for sending your brief to Netdin. It reached us and one of us will read it properly and reply within one working day.</p>
<p style="margin:0 0 12px;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#6b7a70;font-weight:600">Your brief, for your records</p>
${briefTable([
  ['Company', escapeHtml(row.company || '(not given)')],
  ['Services', services],
  ['Budget', escapeHtml(row.budget)],
  ['Timeline', escapeHtml(row.timeline)],
])}
<div style="padding:14px 16px;background:#f7f8f4;border-left:3px solid #2f6b4f;border-radius:0 6px 6px 0;margin:0 0 28px;font-size:14px;line-height:1.6;color:#3a4a3f">${message}</div>
<p style="margin:0;font-size:15px;line-height:1.6">If anything has changed, just reply to this email and it will land with the same people.</p>`

  return emailShell(body, { eyebrow: 'Netdin', heading: 'We have your brief' })
}

function teamHtml(row, consoleUrl) {
  const services = escapeHtml(Array.isArray(row.services) ? row.services.join(', ') : String(row.services ?? ''))
  const message = escapeHtml(row.message).replaceAll('\n', '<br>')

  const body = `
${briefTable([
  ['Name', escapeHtml(row.name)],
  ['Email', `<a href="mailto:${escapeHtml(row.email)}" style="color:#2f6b4f">${escapeHtml(row.email)}</a>`],
  ['Company', escapeHtml(row.company || '(not given)')],
  ['Services', services],
  ['Budget', escapeHtml(row.budget)],
  ['Timeline', escapeHtml(row.timeline)],
])}
<div style="padding:14px 16px;background:#f7f8f4;border-left:3px solid #2f6b4f;border-radius:0 6px 6px 0;margin:0 0 24px;font-size:14px;line-height:1.6;color:#3a4a3f">${message}</div>
<p style="margin:0 0 4px;font-size:12px;color:#9aa89f">Submitted ${escapeHtml(row.$createdAt || '(unknown)')} via ${escapeHtml(row.source || 'netdin.com')}</p>
${consoleUrl ? `<a href="${consoleUrl}" style="display:inline-block;margin-top:12px;font-size:14px;color:#2f6b4f;font-weight:600">Open in Appwrite &rarr;</a>` : ''}`

  return emailShell(body, { eyebrow: 'Netdin enquiries', heading: `New brief from ${row.name}` })
}

async function sendEmail({ apiKey, payload }) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`)
  return text
}

export default async ({ req, res, log, error }) => {
  const { cfg, missing } = readConfig()

  if (missing.length) {
    error(`Not configured. Missing environment variables: ${missing.join(', ')}`)
    return res.json({ ok: false, reason: 'missing-config', missing }, 500)
  }

  const event = req.headers?.['x-appwrite-event'] ?? '(none)'
  const row = readRow(req.body)

  if (!row || !row.email) {
    error(`No usable row in payload. Event: ${event}. Body type: ${typeof req.body}`)
    return res.json({ ok: false, reason: 'bad-payload', event }, 400)
  }

  log(`Enquiry ${row.$id ?? '(no id)'} from ${row.email}, event ${event}`)

  const consoleUrl = consoleRowsUrl(cfg, event)

  const services = Array.isArray(row.services) ? row.services.join(', ') : String(row.services ?? '')

  const [teamResult, ackResult] = await Promise.allSettled([
    sendEmail({
      apiKey: cfg.apiKey,
      payload: {
        from: cfg.from,
        to: [cfg.notifyTo],
        reply_to: row.email,
        subject: `New brief: ${row.name}${services ? ` — ${services}` : ''}`,
        text: teamBody(row, consoleUrl),
        html: teamHtml(row, consoleUrl),
      },
    }),
    sendEmail({
      apiKey: cfg.apiKey,
      payload: {
        from: cfg.from,
        to: [row.email],
        reply_to: cfg.replyTo,
        subject: 'We have your brief — Netdin',
        text: ackText(row),
        html: ackHtml(row),
      },
    }),
  ])

  if (teamResult.status === 'fulfilled') log('Team notification sent')
  else error(`Team notification FAILED: ${teamResult.reason?.message}`)

  if (ackResult.status === 'fulfilled') log('Acknowledgement sent to lead')
  else error(`Acknowledgement FAILED: ${ackResult.reason?.message}`)

  const bothFailed = teamResult.status === 'rejected' && ackResult.status === 'rejected'

  return res.json(
    {
      ok: !bothFailed,
      rowId: row.$id ?? null,
      team: teamResult.status,
      acknowledgement: ackResult.status,
    },
    bothFailed ? 500 : 200,
  )
}
