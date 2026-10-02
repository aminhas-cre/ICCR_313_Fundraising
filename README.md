# 313: Building Our Masjid, Building Our Future

Fundraising tracker for Islamic Center of Castle Rock. 313 founders x $250 = $78,250.

- `/` public progress page (paid vs pledged, Zelle info, top connectors by first name + last initial)
- `/admin` password-protected: add donors, mark paid, track who brought whom, CSV export

Zelle has no API, so a volunteer marks each donor **Paid** once the payment lands.

## Setup
1. Create a Supabase project, run `supabase/migrations/0001_donors.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill in all four values.
3. `npm install && npm run dev`
4. Deploy on Vercel (import this repo, add the same env vars).
