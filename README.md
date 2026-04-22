# Case Management System

A full-stack case management platform designed to streamline operations across project tracking, on-site visits, logistics, inventory, and financial analysis. This system centralizes business workflows into a single, scalable application built with modern web technologies.

---

## 🚀 Features

### 📁 Case Management

* Create, update, and manage cases
* Track case lifecycle, status, and activities
* Associate documents, photos, and installation details
* Maintain structured data across all case-related entities

---

### 👥 User Authentication & Authorization

* Secure authentication using JWT
* Role-based access control:

  * **Admin**: Full system visibility and control
  * **User**: Access restricted to assigned cases
* Admin-controlled user creation with password setup links

---

### 🏠 On-Site Visit Management

* Dynamic room-based data structure
* Add/edit room-level details
* Upload and manage photos per room
* Tag photos with customizable labels
* Add comments and metadata
* Optimized data fetching with SWR and API sync

---

### 📸 Photo & Document Management

* Cloud-based image upload (Cloudinary)
* Store metadata in database
* Support for document uploads and tracking
* Photo tagging, deletion, and updates

---

### 💡 Lighting & Product Tracking

* Manage **suggested** and **existing** lighting products
* Track fixture counts and installation details
* Separate product catalog and fixture reference system

---

### 🚚 Delivery Planner

* Plan and schedule deliveries based on case requirements
* Track delivery status and logistics flow
* Optimize routing and allocation of items
* Associate deliveries with specific cases and products

---

### 📦 Bin Location Management

* Warehouse-style bin location tracking system
* Assign products to specific storage locations
* Improve inventory visibility and retrieval efficiency
* Link bin locations with delivery and case workflows

---

### 💰 Finance Calculator

* Built-in financial tools for:

  * Cost estimation
  * Pricing calculations
  * Discount handling
  * Labor cost tracking
* Supports precise decimal inputs and structured pricing logic

---

### ⚡ Dynamic Energy Report Generation

* Generate energy consumption and efficiency reports dynamically
* Analyze lighting setups and installation impact
* Produce structured reports for decision-making and optimization
* Scalable for future AI-based insights

---

### 📊 Activity Logging

* Track all system actions and updates
* Maintain a full audit trail for transparency
* Monitor user interactions and changes

---

## 🛠️ Tech Stack

### Frontend

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS

### Backend

* Next.js API Routes
* Prisma ORM

### Database

* PostgreSQL (hosted on NeonDB)
* Schema management via Prisma

---

## 🧱 Database Architecture

* Designed using **Prisma ORM** for type-safe database access
* Hosted on **NeonDB (PostgreSQL)** for scalability and performance
* Core models include:

  * Case
  * User
  * Photo
  * Document
  * OnSiteVisit & Rooms
  * Product & Fixture Types
  * ActivityLog
  * Delivery & BinLocation
  * Financial Records

---

## 📂 Project Structure

```bash
/go                # Business logic / utilities
/prisma            # Prisma schema and migrations
/public            # Static assets
/src               # Main application source code
/types             # TypeScript definitions

middleware.ts      # JWT authentication middleware
next.config.ts     # Next.js configuration
package.json       # Dependencies and scripts
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/case-management-app.git
cd case-management-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
# Primary Database (Case Management - NeonDB PostgreSQL)
DATABASE_URL=your_neondb_postgres_url_case_management

# Secondary Database (Bin Location / Inventory System)
DATABASE_URL2=your_neondb_postgres_url_for_bin_location

# Authentication
JWT_SECRET=your_secret_key

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email / Notifications
RESEND_API_KEY=

# Google Services (Maps & Scripts)
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_SCRIPT_URL=

# EmailJS (Client-side Email Service)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=
NEXT_PUBLIC_EMAILJS_SERVICE_ID2=
```

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Start development server

```bash
npm run dev
```

---

## 🔐 Authentication Flow

* Admin creates users and sends password setup link
* Users authenticate and receive JWT token
* Middleware enforces protected routes and role-based access

---

## 📌 Key Modules Overview

| Module             | Description                             |
| ------------------ | --------------------------------------- |
| Case Management    | Core system linking all features        |
| On-Site Visits     | Room-based inspection & data collection |
| Product & Lighting | Fixture tracking and recommendations    |
| Delivery Planner   | Logistics and scheduling                |
| Bin Location       | Inventory storage mapping               |
| Finance Calculator | Costing and pricing logic               |
| Energy Reports     | Analytical reporting engine             |

---

## 📈 Future Improvements

* AI-powered document search (RAG integration)
* Predictive delivery optimization
* Advanced analytics dashboards (Power BI / embedded charts)
* Real-time collaboration features
* Mobile-first UI improvements

---

## 🤝 Contributing

Contributions are welcome. Please fork the repository and submit a pull request.

---

## 📄 License

No License

---

## 👨‍💻 Author

Rick Cheung
Full Stack Developer | Data Analyst | AI Enthusiast

---
