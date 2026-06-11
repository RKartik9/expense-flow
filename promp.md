# ExpenseFlow - AI-Powered Expense Tracker & Bill Split Platform

## Project Overview

Build a modern SaaS web application called **ExpenseFlow** that combines:

1. Daily Expense Tracking
2. Group & Individual Bill Splitting
3. Shared Expense Management
4. Automated Email Reminders
5. Analytics & Insights
6. Team/Family Expense Management

The application should be production-ready, scalable, mobile responsive, and built using modern best practices.

---

# Tech Stack

## Frontend

* Next.js latest (App Router)
* React 19
* TypeScript
* TailwindCSS
* Shadcn UI
* Framer Motion
* React Hook Form
* Zod

## Backend

* Next.js Server Actions
* API Routes
* TypeScript

## Authentication

* Clerk Authentication
* Google Login
* GitHub Login
* Email/Password Login

## Database

* MongoDB

## Email

* Resend

## Hosting

* Vercel

## File Storage

* UploadThing

---

# Core Features

## 1. Authentication

Implement Clerk Authentication with:

### User Features

* Sign Up
* Sign In
* Forgot Password
* Email Verification
* Social Login
* Profile Management

### User Profile

* Name
* Email
* Profile Picture
* Preferred Currency
* Timezone
* Notification Preferences

---

# 2. Expense Tracker

## Daily Expense Management

Users can:

* Add expense
* Edit expense
* Delete expense
* Categorize expense
* Add notes
* Add receipt image
* Add tags

### Expense Fields

* Title
* Amount
* Currency
* Category
* Description
* Date
* Receipt
* Payment Method

### Categories

Default categories:

* Food
* Travel
* Shopping
* Rent
* Utilities
* Entertainment
* Medical
* Education
* Subscription
* Investment
* Salary
* Other

Users can create custom categories.

---

# 3. Dashboard

Beautiful analytics dashboard.

## Dashboard Widgets

### Overview Cards

* Total Expenses
* Total Income
* Monthly Spending
* Monthly Savings
* Pending Splits
* Upcoming Payments

### Charts

* Expense Trend
* Monthly Comparison
* Category Distribution
* Spending Heatmap

### Insights

AI-generated insights:

Examples:

* "Food spending increased 18% this month."
* "You spent ₹3,000 more on subscriptions."
* "Rent accounts for 42% of monthly expenses."

---

# 4. Split Bill System

Core feature of the platform.

---

## Create Split

User can create split:

### Split Types

#### Equal Split

₹1000 among 4 people

Each pays ₹250

---

#### Percentage Split

Person A = 40%

Person B = 35%

Person C = 25%

---

#### Exact Amount Split

Person A = ₹200

Person B = ₹300

Person C = ₹500

---

## Participants

Participants can be added:

### Method 1

By Email Address

Example:

* [john@gmail.com](mailto:john@gmail.com)
* [alex@gmail.com](mailto:alex@gmail.com)

---

### Method 2

From Existing Friends

Friend list system.

---

### Method 3

From Team/Group

Select existing group.

---

# 5. Teams & Groups

Users can create groups.

Examples:

* Family
* Roommates
* Friends
* Office Team
* Vacation Trip
* Startup Team

---

## Group Features

### Create Group

Fields:

* Group Name
* Description
* Cover Image

---

### Invite Members

Invite via email.

Resend sends invitation.

---

### Member Roles

* Owner
* Admin
* Member

---

### Group Dashboard

Show:

* Total Expenses
* Pending Settlements
* Who Owes Whom
* Recent Activity

---

# 6. Debt Simplification Engine

Implement settlement optimization.

Example:

A owes B ₹500

B owes C ₹500

Instead:

A pays C ₹500

Reduce unnecessary transactions.

Generate optimized settlement graph.

---

# 7. Split Reminder System

Using Resend.

Automatic emails.

---

## Reminder Types

### Pending Payment Reminder

Subject:

"You have a pending payment"

---

### Settlement Reminder

Subject:

"Settle your balance"

---

### Weekly Summary

Subject:

"Your weekly expense summary"

---

### Monthly Report

Subject:

"Your monthly financial report"

---

# 8. Email Templates

Create beautiful responsive templates.

### Invitation Email

Invite user to join group.

### Split Created

Notify participants.

### Payment Reminder

Pending payment reminder.

### Settlement Completed

Confirmation email.

### Weekly Summary

Financial summary.

---

# 9. Friend System

Users can:

* Add Friend
* Accept Request
* Reject Request
* Search User

Friendship model similar to social applications.

---

# 10. Settlement Tracking

Track actual payments.

Status:

* Pending
* Partially Paid
* Paid

Methods:

* Cash
* UPI
* Bank Transfer
* Credit Card

Upload payment proof.

---

# 11. Recurring Expenses

Create recurring expenses.

Options:

* Daily
* Weekly
* Monthly
* Quarterly
* Yearly

Auto-create expenses.

---

# 12. Budget Management

Create monthly budgets.

Examples:

Food = ₹10,000

Travel = ₹5,000

Shopping = ₹3,000

Track budget utilization.

Show progress bars.

Send alerts when budget exceeds.

---

# 13. Subscription Tracker

Track subscriptions.

Examples:

* Netflix
* Spotify
* ChatGPT
* AWS
* YouTube Premium

Show:

* Next Renewal
* Cost
* Annual Spending

Send reminders before renewal.

---

# 14. Notifications

In-App Notification Center.

Events:

* New Split
* Payment Received
* Payment Reminder
* Friend Request
* Group Invitation

Real-time updates.

---

# 15. Search & Filters

Global search.

Search:

* Expense
* User
* Group
* Category

Advanced filters:

* Date Range
* Category
* Amount
* Status

---

# 16. Mobile Responsive Design

Fully responsive.

Desktop
Tablet
Mobile

Native app feel.

---

# 17. Dark Mode

Implement:

* Light Mode
* Dark Mode
* System Mode

Persist preference.

---

# Database Design

Create complete Drizzle schemas for:

## Users

## Expenses

## Categories

## Budgets

## Groups

## GroupMembers

## Splits

## SplitParticipants

## Friends

## Notifications

## Settlements

## RecurringExpenses

## SubscriptionTrackers

## EmailLogs

## ActivityLogs

Include:

* Proper indexes
* Relations
* Foreign keys
* Soft deletes
* Audit timestamps

---

# Admin Panel

Admin dashboard.

Manage:

* Users
* Groups
* Expenses
* Email Logs
* Reports

Analytics:

* Total Users
* Active Users
* Revenue Metrics
* Growth Metrics

---

# Security

Implement:

* Clerk authentication guards
* Rate limiting
* Input validation
* Server-side authorization
* Secure API design
* CSRF protection
* XSS prevention

---

# Performance

* Server Components first
* Streaming
* Suspense
* Optimistic UI
* Infinite Pagination
* Database indexing
* Image optimization

---

# Deliverables

Generate:

1. Complete folder structure
2. Database schema
3. Drizzle models
4. Server actions
5. API routes
6. Reusable UI components
7. Dashboard pages
8. Group management pages
9. Split bill pages
10. Resend integration
11. Clerk integration
12. Email templates
13. Settlement engine
14. Analytics dashboard
15. Production deployment guide

The codebase should follow enterprise-grade architecture, clean code principles, TypeScript best practices, and scalable SaaS patterns.
