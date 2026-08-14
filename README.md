# yourinvoicemaker

Build a modern, professional and responsive Invoice Generator SaaS called InvoicePro.

Design

Use a clean premium SaaS UI:

White cards, light gray background

Blue/indigo primary color

Modern typography, Lucide icons

Subtle shadows, borders and animations

Fully responsive

Light/Dark mode

Pages

Landing Page

Login / Signup

Dashboard

Create Invoice

Invoices

Customers

Business Profile

Settings

Public Invoice View

Dashboard

Show:

Total Invoices

Paid

Pending

Overdue

Recent invoices

Search & filters

Create Invoice button

Invoice Builder

Create a two-column layout:

Form:

Business & customer information

Invoice number/date/due date

Currency

Dynamic items

Quantity & price

Tax, discount & shipping

Notes & terms

Preview:
Show a professional invoice that updates live as the user edits the form.

Automatically calculate subtotal, tax, discount and total.

Features

3–4 invoice templates

Custom accent color

Save/Edit/Delete/Duplicate invoices

Invoice status: Draft, Pending, Paid, Overdue

Download PDF

Print

Share public invoice link

Customer management

Business profile

Search & filtering

Toast notifications and proper loading/error states

Backend

Use Supabase for authentication and PostgreSQL database.

Tables:
profiles, business_profiles, customers, invoices, invoice_items

Use Row Level Security so users can only access their own data.

Goal

Make the main workflow extremely simple:

Create → Fill → Add Items → Preview → Save → Download PDF

The final result should look like a polished real-world SaaS product, not a basic demo.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://yourinvoicemaker.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/11666a70-0ccc-4e69-94ee-fee117c7a0ff).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
