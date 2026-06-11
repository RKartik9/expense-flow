# ExpenseFlow

Expense tracking and bill splitting. Track daily spending, split bills with friends or groups, and settle up with the fewest possible transactions.

Built with Next.js 16, React 19, TypeScript, MongoDB (Mongoose), Clerk, Resend, UploadThing, Tailwind CSS, and shadcn/ui.

## What it does

- Track expenses and income with categories, tags, payment methods, and receipt uploads
- Split bills equally, by percentage, or by exact amounts
- Groups with roles (owner / admin / member) and email invites
- Settlement engine that simplifies debts into minimal transactions
- Monthly budgets per category with overspend alerts
- Recurring expenses and subscription renewal tracking
- Email reminders, weekly summaries, and monthly reports
- Dashboard with trend, comparison, category, and heatmap charts
- In-app notifications, global search (Cmd+K), dark mode
- Admin panel for users, groups, expenses, and email logs

## Requirements

- Node.js 20+
- A MongoDB database ([Atlas](https://www.mongodb.com/atlas) free tier works)
- A [Clerk](https://dashboard.clerk.com) application
- Optional: [Resend](https://resend.com) for emails, [UploadThing](https://uploadthing.com) for receipt uploads. The app runs without them; those features are just disabled.

## Setup

```bash
git clone <repo-url>
cd expense-tracker
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | yes | Include a database name in the URI, e.g. `.../expenseflow` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | yes | From Clerk dashboard |
| `CLERK_SECRET_KEY` | yes | From Clerk dashboard |
| `CLERK_WEBHOOK_SIGNING_SECRET` | no | Only needed if you set up the Clerk webhook |
| `RESEND_API_KEY` | no | Emails are skipped without it |
| `EMAIL_FROM` | no | Verified sender, e.g. `ExpenseFlow <noreply@yourdomain.com>` |
| `UPLOADTHING_TOKEN` | no | Receipt/cover uploads are disabled without it |
| `CRON_SECRET` | yes | Any random string, protects cron endpoints |
| `NEXT_PUBLIC_APP_URL` | yes | `http://localhost:3000` in development |

In Clerk, enable the sign-in methods you want (Google, GitHub, email/password all work out of the box).

Then:

```bash
npm run dev
```

Open http://localhost:3000. Default categories are seeded on first sign-in.

### Clerk webhook (optional)

User data syncs to MongoDB lazily on sign-in, so the webhook is not required locally. For production it keeps profiles up to date: add an endpoint in Clerk pointing to `https://<your-domain>/api/webhooks/clerk`, subscribe to `user.created`, `user.updated`, `user.deleted`, and put the signing secret in `CLERK_WEBHOOK_SIGNING_SECRET`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm test` | Run unit tests (settlement engine, split math) |
| `npm run lint` | ESLint |

## Project structure

```
src/
  app/
    (auth)/          sign-in, sign-up
    (app)/           dashboard, expenses, splits, groups, friends,
                     budgets, subscriptions, recurring, settings, admin
    api/             Clerk webhook, UploadThing, cron endpoints
  components/        UI, organized by feature
  emails/            react-email templates
  lib/
    models/          15 Mongoose models
    actions/         server actions (all mutations, Zod-validated)
    settlement/      debt simplification + split math
    db.ts            cached Mongoose connection
  proxy.ts           Clerk route protection
```

## Cron jobs

Defined in `vercel.json`, authenticated with `Authorization: Bearer $CRON_SECRET`:

| Endpoint | Schedule | Job |
| --- | --- | --- |
| `/api/cron/recurring` | daily 01:00 | Create expenses from recurring rules |
| `/api/cron/reminders` | daily 09:00 | Pending payment reminders |
| `/api/cron/subscriptions` | daily 09:30 | Subscription renewal reminders |
| `/api/cron/weekly-summary` | Mon 10:00 | Weekly spending summary email |
| `/api/cron/monthly-report` | 1st 10:00 | Monthly report email |

## Deploying to Vercel

1. Push to GitHub, import the repo into Vercel.
2. Add every variable from `.env.example` in project settings. Set `NEXT_PUBLIC_APP_URL` to the production URL and use a strong `CRON_SECRET`.
3. Cron jobs are registered automatically from `vercel.json`.
4. Point the Clerk webhook at the production domain.

## Admin access

Set `role: "admin"` on a user document in MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

The admin panel is at `/admin`.

## License

MIT
