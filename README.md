# 313: Building Our Masjid, Building Our Future

Fundraising tracker for Islamic Center of Castle Rock. 313 tickets x $250 = $78,250.
Every ticket has its own number, **ICCR-1 through ICCR-313**.

## For donors
- `/` landing page: two thermometers (pledged, paid), how it works, running list of pledges
- `/pledge` choose how many tickets; each gets its own ICCR number. `?pay=1` ("Pledge and pay") lands on a pay-now step
- `/status` look up your tickets by email; tick the tickets you've passed on to someone (private note only)
- `/t/<token>` private link version of the same view

## For the committee (`/admin`, shared password)
- `/admin` pledgers, add a pledge for someone, delete
- `/admin/tickets` mark tickets paid by number (`ICCR-2, 3, 5-9`), per-ticket toggle, activity log
- `/admin/settings` goal, ticket price, Zelle, offline adjustments, receipt identity, alert email
- `/api/export` CSV of every ticket

Payments are matched by hand (Zelle has no API): look at the bank, find the ticket number in the memo, mark it paid.

## Email (optional until configured)
Set `RESEND_API_KEY` and `EMAIL_FROM` (and optionally `EMAIL_REPLY_TO`). Until then everything works and emails are skipped.
Sends: pledge confirmation to the donor, a new-pledge alert to the address in Settings, and a receipt when tickets are marked paid.

## Setup
1. Create a Supabase project and run the files in `supabase/migrations/` in order.
2. Copy `.env.example` to `.env.local` and fill it in.
3. `npm install && npm run dev`
4. Deploy on Vercel with the same env vars.
