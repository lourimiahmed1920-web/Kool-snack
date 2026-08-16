/*
  Shared Intl formatters. Each `new Intl.NumberFormat(...)` is comparatively
  expensive to construct, and these were previously re-created per module (and in
  some cases per render) — one instance each, reused everywhere.
*/

export const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

export const dateTimeFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'long', timeStyle: 'short' })

export const timeFormat = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' })
