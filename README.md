# Givers.ng — Next.js App

Community gifting platform by **BallHard Charities**. Swipe. Claim. Bless.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 + React 19 |
| Styling | Tailwind CSS v4 |
| API | Next.js Route Handlers (Node.js) |
| Payment | Paystack Inline JS |
| Icons | FontAwesome 6 |

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Add your Paystack keys
# Edit .env.local and replace the placeholder keys

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── claims/route.ts   # POST claim + rate limiting (2/day)
│   │   ├── gifts/route.ts    # GET/POST gifts
│   │   └── wishes/route.ts   # GET/POST wishes
│   ├── globals.css           # Tailwind v4 theme + custom CSS
│   ├── layout.tsx
│   └── page.tsx              # Main app shell
├── components/
│   ├── CoverPage.tsx         # Mosaic splash screen
│   ├── Header.tsx            # Nav + category pills
│   ├── BottomNav.tsx         # Tab bar + FAB
│   ├── SwipeStack.tsx        # Tinder-style card swipe
│   ├── WishesFeed.tsx        # Community wishes list
│   ├── ProfileTab.tsx        # User profile + stats
│   ├── ClaimModal.tsx        # 2-step claim + ₦500 payment
│   ├── GiveModal.tsx         # List an item form
│   └── Toast.tsx             # Notification toasts
└── lib/
    ├── constants.ts          # States, categories, sample data
    ├── types.ts              # TypeScript interfaces
    └── claims.ts             # Client-side daily limit helpers
```

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/gifts` | GET | List gifts (filter by category, state) |
| `/api/gifts` | POST | Publish a new gift |
| `/api/wishes` | GET | List community wishes |
| `/api/wishes` | POST | Post a new wish |
| `/api/claims` | GET | Check remaining claims for an email |
| `/api/claims` | POST | Record a verified claim |

## Going to Production

1. Replace the in-memory stores in API routes with **Prisma + PostgreSQL**
2. Add Paystack webhook endpoint at `/api/webhooks/paystack` to verify payments server-side
3. Add auth with **NextAuth.js** (phone/OTP or email magic link)
4. Deploy to **Vercel** (zero config for Next.js)
