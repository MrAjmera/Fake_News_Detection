// DEMO SIGN-IN ONLY. This is a single shared id and password checked in the
// browser. It stops casual visitors from opening the demo, but it is NOT real
// security: anyone can read these values in the built JavaScript. Do not reuse
// a real password here.
//
// To change them, set VITE_DEMO_USER and VITE_DEMO_PASS in frontend/.env.local
// and run `npm run build` again (see frontend/.env.example).

export const DEMO_USER = import.meta.env.VITE_DEMO_USER || 'demo'
export const DEMO_PASS = import.meta.env.VITE_DEMO_PASS || 'PBL5@MUJ2026'
