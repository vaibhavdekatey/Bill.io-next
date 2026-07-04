<div align="center">
  <img src="public/bill.io_full.svg" alt="Bill.io Logo" width="300" />
</div>

<h1 align="center">Bill.io</h1>

<p align="center">
  <strong>The Simplest Way to Quote and Invoice Your Clients.</strong>
</p>

<p align="center">
  Bill.io is the all-in-one platform built specifically for freelancers, agencies, and independent contractors. Seamlessly manage clients, create professional quotations, and automate your invoicing so you can focus on the work that actually matters.
</p>

---

## ✨ Features

- **Client Management:** Easily store and track all your client details, organizations, and contact information.
- **Quotations:** Create and send beautiful, itemized quotations.
- **Invoicing:** Convert quotations into projects, or generate professional invoices instantly.
- **PDF Generation:** Export your invoices and quotes directly to pixel-perfect PDFs.
- **Responsive Design:** A beautifully crafted dark-mode UI that scales perfectly across desktops, tablets, and mobile devices.
- **Secure Authentication:** Passwordless Google OAuth support alongside secure credential logins.

## 🛠 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Database:** [Neon Serverless Postgres](https://neon.tech/)
- **ORM:** [Prisma](https://www.prisma.io/) (with Serverless/Edge adapters)
- **Authentication:** [NextAuth.js v5](https://authjs.dev/) (Auth.js)
- **PDF Generation:** [@react-pdf/renderer](https://react-pdf.org/)
- **Animations:** [Tw-animate-css](https://github.com/) & [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) and `npm` installed on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/bill.io.git
cd bill.io
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root of the project and add the following variables. See `.env.example` if available.

```env
# Database
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"

# NextAuth Configuration
AUTH_SECRET="your-super-secret-auth-key"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# OAuth (Google)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"

# CORS / Origin
CORS_ORIGIN="http://localhost:3000"
```

### 4. Setup the Database
Since this project uses Neon DB and Prisma's serverless edge driver, ensure your `DATABASE_URL` is configured correctly.

To push the database schema and migrations to your Neon database, run:
```bash
npx prisma migrate deploy
```

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 🗄️ Database Architecture (Prisma)

Bill.io utilizes Prisma to interact with a Serverless PostgreSQL database hosted on Neon. The database schema encompasses:
- `User` & `AuthAccount`: Handles multiple providers (Credentials, Google).
- `Organization` & `OrganizationMember`: Supports multi-tenant workspaces.
- `Client`: Stores metadata for organizations being billed.
- `Project`, `Quotation`, & `Invoice`: Core entities tracking financials and line-items.

## 🎨 UI/UX

This project features a meticulously crafted dark theme, using custom fonts (Geist & Lexend), fluid layouts, horizontal-scrolling data tables for mobile compatibility, and rich micro-interactions on buttons and navigation elements.

---

<p align="center">
  Built with ❤️ for independent creators.
</p>
