import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

/*
  Generates a self-signed certificate covering this machine's LAN IP addresses,
  for `npm run dev:mobile:https`.

  Why not just use @vitejs/plugin-basic-ssl: it puts every entry from its
  `domains` option into the certificate as a *dNSName*. TLS requires an
  *iPAddress* SAN entry to match a bare IP literal (RFC 6125), and iOS Safari
  enforces that — so with basic-ssl an iPhone sees a hostname mismatch on top of
  the untrusted issuer, and is much less willing to offer an override. This
  writes the IPs as real iPAddress entries, leaving "untrusted issuer" as the
  only complaint, which Safari lets you accept.

  Re-run whenever the Wi-Fi address changes (DHCP): `npm run cert:lan`.
*/

const OUT_DIR = path.resolve('certs')
const KEY = path.join(OUT_DIR, 'lan-key.pem')
const CERT = path.join(OUT_DIR, 'lan-cert.pem')

const ips = Object.values(os.networkInterfaces())
  .flat()
  .filter((i) => i && i.family === 'IPv4' && !i.internal)
  .map((i) => i.address)

const altNames = [
  'DNS.1 = localhost',
  ...ips.map((ip, index) => `IP.${index + 1} = ${ip}`),
  `IP.${ips.length + 1} = 127.0.0.1`,
]

const config = `[req]
distinguished_name = dn
x509_extensions = ext
prompt = no

[dn]
CN = Kool Snack dev

[ext]
subjectAltName = @alt
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt]
${altNames.join('\n')}
`

fs.mkdirSync(OUT_DIR, { recursive: true })
const configPath = path.join(OUT_DIR, 'openssl.cnf')
fs.writeFileSync(configPath, config)

/*
  On Windows `openssl` usually isn't on the PATH that Node sees — it ships with
  Git for Windows and is only reachable from a Git Bash shell. Try the bare name
  first (Linux/macOS, or a real Windows install), then the Git locations.
*/
const candidates = [
  'openssl',
  'C:\\Program Files\\Git\\usr\\bin\\openssl.exe',
  'C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe',
]

const args = [
  'req', '-x509', '-nodes',
  '-newkey', 'rsa:2048',
  '-keyout', KEY,
  '-out', CERT,
  '-days', '365',
  '-config', configPath,
]

let generated = false
for (const bin of candidates) {
  try {
    execFileSync(bin, args, { stdio: 'inherit' })
    generated = true
    break
  } catch {
    // Try the next candidate.
  }
}

if (!generated) {
  fs.unlinkSync(configPath)
  console.error('openssl not found. Install it, or run this from a Git Bash shell.')
  process.exit(1)
}

fs.unlinkSync(configPath)

console.log('\nCertificate written to certs/ covering:')
console.log('  localhost, 127.0.0.1')
for (const ip of ips) console.log('  ' + ip)
