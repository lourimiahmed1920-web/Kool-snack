import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

/*
  Three dev modes, selected by `--mode` (see the npm scripts):

    default  localhost only — the everyday loop
    mobile   bound to 0.0.0.0 over plain HTTP, to open the app on a phone on the
             same Wi-Fi
    mobile-https
             same, but with a self-signed certificate. Needed because
             navigator.geolocation and the camera only work in a secure context,
             and "secure" means HTTPS or localhost — not a LAN IP. Without it
             /staff/pointage cannot get a position fix from a phone.

  `.env.local` is still loaded in every mode, so the Supabase credentials work
  the same in all three.
*/

const LAN_KEY = 'certs/lan-key.pem'
const LAN_CERT = 'certs/lan-cert.pem'

/**
 * Prefer the certificate from `npm run cert:lan`, which lists the LAN IPs as
 * real iPAddress SAN entries. @vitejs/plugin-basic-ssl only emits dNSName
 * entries, which do not match a bare IP literal under RFC 6125 — iOS Safari
 * enforces that and then baulks at the extra hostname mismatch. basic-ssl stays
 * as the fallback so this mode still works without running the script.
 */
function hasLanCert(): boolean {
  return fs.existsSync(LAN_KEY) && fs.existsSync(LAN_CERT)
}

export default defineConfig(({ mode }) => {
  const onPhone = mode === 'mobile' || mode === 'mobile-https'
  const secure = mode === 'mobile-https'
  const useLanCert = secure && hasLanCert()

  return {
    plugins: [react(), ...(secure && !useLanCert ? [basicSsl()] : [])],

    server: {
      // `true` binds every interface, so the LAN IP is reachable.
      host: onPhone,
      https: useLanCert
        ? { key: fs.readFileSync(LAN_KEY), cert: fs.readFileSync(LAN_CERT) }
        : undefined,
      watch: {
        // `cap sync` copies dist/ into both native projects. Without this the dev
        // server watches those copies and fires a full page reload for every file
        // it writes — a reload storm on each sync, for files that are build output.
        ignored: ['**/android/**', '**/ios/**'],
      },
    },
  }
})
