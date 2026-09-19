import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const APPWRITE_VARS = [
  'VITE_APPWRITE_ENDPOINT',
  'VITE_APPWRITE_PROJECT_ID',
  'VITE_APPWRITE_DATABASE_ID',
  'VITE_APPWRITE_TABLE_ID',
]

// Vite copies VITE_* values into the JavaScript while it builds. If they are empty at
// that moment, the enquiry form ships permanently broken and setting them afterwards
// changes nothing: Rollup sees the guard clause in submitBrief() is always true and
// removes the Appwrite client entirely. Nothing reports this at runtime, so warn here.
function warnIfEnquiriesUnconfigured(): Plugin {
  return {
    name: 'netdin:warn-if-enquiries-unconfigured',
    apply: 'build',
    configResolved(config) {
      const missing = APPWRITE_VARS.filter((name) => !config.env[name])
      if (missing.length === 0) return

      const rule = '='.repeat(74)
      console.warn(['',
        rule,
        '  WARNING: the contact form will NOT work in this build.',
        rule,
        '',
        '  These settings are empty or missing:',
        ...missing.map((name) => `    - ${name}`),
        '',
        '  What happens: the site builds fine and looks fine, but nobody can send',
        '  a project brief. The form shows an error asking visitors to email',
        '  hello@netdin.com instead.',
        '',
        '  Why: Vite copies these settings into the JavaScript while it builds.',
        '  Adding them after the build does nothing. Set them first, then build.',
        '',
        '  To fix in Appwrite:',
        '    1. Open your Site, then Settings, then Environment variables.',
        '    2. Add all four values.',
        '    3. Redeploy, so it builds again with the settings in place.',
        '',
        '  To check any deployed site afterwards:',
        '    node scripts/check-deployment.mjs https://your-site-url',
        '',
        rule,
        ''].join('\n'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), warnIfEnquiriesUnconfigured()],
})
