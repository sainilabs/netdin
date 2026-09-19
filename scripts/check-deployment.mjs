#!/usr/bin/env node

// Checks whether a deployed Netdin site can actually receive enquiries.
//
// You do not need Appwrite access to run this. The answer is visible in the
// JavaScript the site serves: if the Appwrite client was compiled in, the four
// VITE_APPWRITE_* settings were present when the site was built. If it was
// stripped out, they were missing, and the contact form is dead.
//
// Usage:
//   node scripts/check-deployment.mjs https://netdin.com

const url = process.argv[2]

if (!url) {
  console.error('Usage: node scripts/check-deployment.mjs <url>')
  process.exit(2)
}

// Strings the Appwrite SDK leaves in the bundle when it is actually used.
const SDK_MARKERS = ['AppwriteException', 'X-Appwrite-Project', 'setEndpoint']
const NOT_CONNECTED = 'Online enquiries are not connected yet'

async function main() {
  const base = url.replace(/\/+$/, '')

  const pageResponse = await fetch(base + '/')
  if (!pageResponse.ok) {
    console.error(`Could not load ${base}/ (HTTP ${pageResponse.status})`)
    process.exit(2)
  }
  const html = await pageResponse.text()

  const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/)
  if (!match) {
    console.error('Could not find the main JavaScript file in the page.')
    console.error('Is this a built Netdin site?')
    process.exit(2)
  }

  const bundleUrl = base + match[1]
  const bundleResponse = await fetch(bundleUrl)
  if (!bundleResponse.ok) {
    console.error(`Could not load ${bundleUrl} (HTTP ${bundleResponse.status})`)
    process.exit(2)
  }
  const bundle = await bundleResponse.text()

  const found = SDK_MARKERS.filter((marker) => bundle.includes(marker))
  const hasFallbackMessage = bundle.includes(NOT_CONNECTED)
  const configured = found.length > 0

  console.log('')
  console.log(`Site:   ${base}`)
  console.log(`Bundle: ${match[1]}  (${Math.round(bundle.length / 1024)} kB)`)
  console.log('')
  console.log('Appwrite client compiled into the bundle:')
  for (const marker of SDK_MARKERS) {
    console.log(`  ${found.includes(marker) ? 'yes' : 'no '}  ${marker}`)
  }
  console.log('')

  if (configured) {
    console.log('RESULT: the contact form is connected.')
    console.log('The four VITE_APPWRITE_* settings were present when this was built.')
    console.log('')
    console.log('Still worth doing by hand: send a real test brief through the form')
    console.log('and confirm the row appears in the Appwrite table.')
    process.exit(0)
  }

  console.log('RESULT: the contact form is NOT connected. Visitors cannot send a brief.')
  console.log('')
  console.log('The Appwrite client is missing from the bundle, which means the four')
  console.log('VITE_APPWRITE_* settings were empty when this site was built.')
  if (hasFallbackMessage) {
    console.log('The form will show the "please email us instead" message every time.')
  }
  console.log('')
  console.log('To fix:')
  console.log('  1. In Appwrite, open the Site, then Settings, then Environment variables.')
  console.log('  2. Add VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID,')
  console.log('     VITE_APPWRITE_DATABASE_ID and VITE_APPWRITE_TABLE_ID.')
  console.log('  3. Redeploy. The settings must be in place BEFORE the build runs.')
  process.exit(1)
}

main().catch((error) => {
  console.error(`Check failed: ${error.message}`)
  process.exit(2)
})
