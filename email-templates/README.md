# Broadcast email templates (Resend)

- `announcement.html`: launch email ("Will you be one of the 313?").
- `progress-update.html`: reusable update; fill the variables below each time.

**How to use**
1. Resend → Broadcasts (or Templates) → new → paste the file's HTML.
2. Progress update variables: `PLEDGED`, `PAID`, `LEFT`, `PERCENT` (0–100, no % sign). Each has a fallback if left blank. `FIRST_NAME` comes from the contact.
3. Send a test to yourself first, then send to your opted-in audience. Keep `{{{RESEND_UNSUBSCRIBE_URL}}}`; Resend fills it in.

**Subject lines**
- Announcement: "Will you be one of the 313?" · "313 people. $250 each. One masjid." · "Help keep ICCR's doors open"
- Progress: "{{PLEDGED}} of 313 so far, JazakAllah" · "We're {{PERCENT}}% of the way there"

Numbers for the progress update come from the live tracker at https://313.islamiccentercastlerock.org.
