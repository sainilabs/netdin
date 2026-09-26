/**
 * Local test for the enquiry notifier. No network, no Resend account needed.
 * Run: node functions/enquiry-notify/test.mjs
 *
 * fetch is stubbed, so this checks the logic and the email payloads without
 * sending anything or needing credentials.
 */

import handler from './src/main.js'

let failures = 0
const check = (name, condition, detail = '') => {
  if (condition) {
    console.log(`  ok    ${name}`)
  } else {
    failures += 1
    console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ''}`)
  }
}

const ROW = {
  $id: '6ab4edbb002c5b90e6c6',
  $createdAt: '2026-09-24T09:30:36.896+00:00',
  name: 'Alex Taylor',
  email: 'alex@example.com',
  company: 'Example Ltd',
  services: ['AI integration', 'Automation'],
  budget: "Let's discuss and scope it properly",
  timeline: '1 - 3 months',
  message: 'We need a customer support agent and some workflow automation.',
  consent: true,
  source: 'netdin.com',
  consentVersion: '2026-09-12',
}

const ENV = {
  RESEND_API_KEY: 'test-key',
  MAIL_FROM: 'Netdin <hello@netdin.com>',
  NOTIFY_TO: 'hello@netdin.com',
  APPWRITE_FUNCTION_PROJECT_ID: '6aa51b7900301ddf37b8',
}

function makeCtx(body, headers = { 'x-appwrite-event': 'tablesdb.netdin.tables.enquiries.rows.abc.create' }) {
  const out = { logs: [], errors: [], json: null, status: null }
  return {
    ctx: {
      req: { body, headers },
      res: { json: (payload, status = 200) => { out.json = payload; out.status = status; return payload } },
      log: (m) => out.logs.push(String(m)),
      error: (m) => out.errors.push(String(m)),
    },
    out,
  }
}

function stubFetch(behaviour) {
  const calls = []
  globalThis.fetch = async (url, init) => {
    const payload = JSON.parse(init.body)
    calls.push({ url, auth: init.headers.Authorization, payload })
    const verdict = behaviour(payload, calls.length)
    if (verdict === 'fail') return { ok: false, status: 422, text: async () => '{"message":"stubbed failure"}' }
    return { ok: true, status: 200, text: async () => '{"id":"stub-id"}' }
  }
  return calls
}

function withEnv(vars, fn) {
  const saved = {}
  for (const [k, v] of Object.entries(vars)) { saved[k] = process.env[k]; if (v === undefined) delete process.env[k]; else process.env[k] = v }
  return Promise.resolve(fn()).finally(() => {
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v }
  })
}

const realFetch = globalThis.fetch

console.log('\n1. happy path: both emails sent')
await withEnv(ENV, async () => {
  const calls = stubFetch(() => 'ok')
  const { ctx, out } = makeCtx(ROW)
  await handler(ctx)

  check('two emails attempted', calls.length === 2, `got ${calls.length}`)
  check('hits Resend', calls.every((c) => c.url === 'https://api.resend.com/emails'))
  check('bearer token set', calls.every((c) => c.auth === 'Bearer test-key'))

  const team = calls.find((c) => c.payload.to[0] === 'hello@netdin.com')
  const ack = calls.find((c) => c.payload.to[0] === 'alex@example.com')

  check('team email exists', Boolean(team))
  check('ack email exists', Boolean(ack))
  check('team subject names the lead and services', team?.payload.subject === 'New brief: Alex Taylor — AI integration, Automation', team?.payload.subject)
  check('team email has both text and html', Boolean(team?.payload.text) && Boolean(team?.payload.html))
  check('team html carries the message', team?.payload.html.includes('workflow automation'))
  check('team html links the console row', team?.payload.html.includes('row-6ab4edbb002c5b90e6c6') || team?.payload.html.includes('databases/tablesdb'))
  check('team text still has visual dividers', team?.payload.text.includes('==='))
  check('team reply-to is the lead', team?.payload.reply_to === 'alex@example.com')
  check('team body carries the message', team?.payload.text.includes('workflow automation'))
  check('team body carries budget', team?.payload.text.includes("Let's discuss and scope it properly"))
  check(
    'team body links the verified console URL',
    team?.payload.text.includes(
      'https://appwrite.io/projects/6aa51b7900301ddf37b8/databases/tablesdb/netdin/tables/enquiries/rows',
    ),
    team?.payload.text.split('Open in Appwrite: ')[1],
  )
  check('ack greets by first name only', ack?.payload.text.startsWith('Hi Alex,'))
  check('ack promises one working day', ack?.payload.text.includes('one working day'))
  check('ack reply-to is the shared inbox', ack?.payload.reply_to === 'hello@netdin.com')
  check('ack has html and text', Boolean(ack?.payload.html) && Boolean(ack?.payload.text))
  check('ack text echoes their own message', ack?.payload.text.includes('workflow automation'))
  check('ack text echoes services picked', ack?.payload.text.includes('AI integration, Automation'))
  check('ack text echoes budget', ack?.payload.text.includes("Let's discuss and scope it properly"))
  check('ack text echoes timeline', ack?.payload.text.includes('1 - 3 months'))
  check('ack html echoes their own message', ack?.payload.html.includes('workflow automation'))
  check('ack html echoes services picked', ack?.payload.html.includes('AI integration, Automation'))
  check('ack text still has visual dividers', ack?.payload.text.includes('==='))
  check('ack html has a bordered brief table', ack?.payload.html.includes('<table'))
  check('ack html uses the shared brand shell', ack?.payload.html.includes('netdin.com') && ack?.payload.html.includes('Netdin'))
  check('returns ok', out.json?.ok === true && out.status === 200)
  check('both reported fulfilled', out.json?.team === 'fulfilled' && out.json?.acknowledgement === 'fulfilled')
})

console.log('\n2. lead address bounces: team email must still succeed')
await withEnv(ENV, async () => {
  stubFetch((payload) => (payload.to[0] === 'alex@example.com' ? 'fail' : 'ok'))
  const { ctx, out } = makeCtx(ROW)
  await handler(ctx)
  check('still returns ok', out.json?.ok === true && out.status === 200)
  check('team fulfilled', out.json?.team === 'fulfilled')
  check('ack rejected', out.json?.acknowledgement === 'rejected')
  check('failure logged', out.errors.some((e) => e.includes('Acknowledgement FAILED')))
})

console.log('\n3. both sends fail: surfaces as a failed execution')
await withEnv(ENV, async () => {
  stubFetch(() => 'fail')
  const { ctx, out } = makeCtx(ROW)
  await handler(ctx)
  check('returns 500', out.status === 500 && out.json?.ok === false)
})

console.log('\n4. body arrives as a JSON string')
await withEnv(ENV, async () => {
  const calls = stubFetch(() => 'ok')
  const { ctx, out } = makeCtx(JSON.stringify(ROW))
  await handler(ctx)
  check('parsed and sent', calls.length === 2 && out.json?.ok === true)
})

console.log('\n5. missing config fails loudly instead of silently')
await withEnv({ ...ENV, RESEND_API_KEY: undefined }, async () => {
  stubFetch(() => 'ok')
  const { ctx, out } = makeCtx(ROW)
  await handler(ctx)
  check('returns 500', out.status === 500)
  check('names the missing var', out.json?.missing?.includes('RESEND_API_KEY'))
})

console.log('\n6. junk payload rejected without sending')
await withEnv(ENV, async () => {
  const calls = stubFetch(() => 'ok')
  const { ctx, out } = makeCtx('not json at all')
  await handler(ctx)
  check('no emails attempted', calls.length === 0)
  check('returns 400', out.status === 400 && out.json?.reason === 'bad-payload')
})

console.log('\n7. html is escaped, so a name cannot inject markup')
await withEnv(ENV, async () => {
  const calls = stubFetch(() => 'ok')
  const { ctx } = makeCtx({ ...ROW, name: '<script>alert(1)</script>Bob', email: 'bob@example.com' })
  await handler(ctx)
  const ack = calls.find((c) => c.payload.to[0] === 'bob@example.com')
  check('no raw script tag in html', !ack?.payload.html.includes('<script>'), ack?.payload.html?.slice(0, 120))
  check('name still appears, escaped, not stripped', ack?.payload.html.includes('&lt;script&gt;alert(1)&lt;/script&gt;Bob'))
})

console.log('\n8. a different real submitter is greeted by their own name, not a fixture')
await withEnv(ENV, async () => {
  const calls = stubFetch(() => 'ok')
  const REAL_PERSON = {
    ...ROW,
    $id: 'zz9f2a1c0031bb002c88',
    name: 'Priya Chandrasekaran',
    email: 'priya.c@somecompany.in',
    company: 'Some Company Pvt Ltd',
    services: ['Website development'],
    budget: 'Under $5,000',
    timeline: 'As soon as possible',
    message: 'We need a new marketing site before our product launch next month.',
  }
  const { ctx } = makeCtx(REAL_PERSON)
  await handler(ctx)
  const ack = calls.find((c) => c.payload.to[0] === 'priya.c@somecompany.in')
  const team = calls.find((c) => c.payload.to[0] === 'hello@netdin.com')

  check('greets by her real first name', ack?.payload.text.startsWith('Hi Priya,'), ack?.payload.text.split('\n')[0])
  check('never mentions the fixture name', !ack?.payload.html.includes('Alex'))
  check('team subject carries her real name', team?.payload.subject.includes('Priya Chandrasekaran'), team?.payload.subject)
  check('her own message is echoed back to her', ack?.payload.text.includes('product launch'))
  check('her budget selection is echoed back to her', ack?.payload.text.includes('Under $5,000'))
})

console.log('\n9. console link degrades safely when the event is a wildcard or absent')
await withEnv(ENV, async () => {
  const calls = stubFetch(() => 'ok')
  const { ctx } = makeCtx(ROW, { 'x-appwrite-event': 'tablesdb.*.tables.*.rows.*.create' })
  await handler(ctx)
  const team = calls.find((c) => c.payload.to[0] === 'hello@netdin.com')
  check('no half-built url emitted', !team?.payload.text.includes('Open in Appwrite'))
  check('brief still sent', calls.length === 2)
})

globalThis.fetch = realFetch
console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`)
process.exit(failures === 0 ? 0 : 1)
