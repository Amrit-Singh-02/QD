# Quick Drop — Complete Project Documentation

## 1. Project Overview

**Quick Drop** is a full-stack, real-time grocery delivery web application. It connects customers, administrators, and delivery agents on a single platform — enabling users to browse products, place orders with online/COD payment, track deliveries live on a map, manage a smart pantry (Pantry OS), get AI-powered recipe suggestions, and raise help tickets. Admins manage the entire catalogue, orders, agents, and view analytics. Delivery agents receive orders in real-time via WebSocket, accept/reject them, and update delivery status with live GPS tracking.

### Key Highlights
- Real-time order assignment engine with scoring algorithm (distance, performance, acceptance rate, fairness)
- Live GPS tracking with Leaflet maps and Socket.IO
- AI-powered recipe generation from pantry items using OpenAI GPT-4o
- PayPal & Stripe payment integration with INR→USD conversion
- Smart Pantry OS with expiry alerts, auto-reorder suggestions, and barcode scanning
- Admin dashboard with full analytics (Chart.js)
- Role-based access: User, Admin, Delivery Agent
- Push notifications via Firebase Cloud Messaging (FCM)
- Dark/Light theme toggle

---

## 2. Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI library (SPA) |
| Vite 7 | Build tool & dev server |
| React Router DOM 7 | Client-side routing |
| Tailwind CSS 4 | Utility-first styling |
| Axios | HTTP client for API calls |
| Socket.IO Client | Real-time WebSocket communication |
| Chart.js + react-chartjs-2 | Analytics charts in admin dashboard |
| Leaflet | Interactive maps for live tracking |
| @stripe/react-stripe-js | Stripe payment UI components |
| @zxing/library | Barcode scanning for Pantry OS |
| react-hot-toast | Toast notifications |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose 9 | NoSQL database & ODM |
| Socket.IO | Real-time bidirectional events |
| Redis + ioredis | Caching, agent locks, timer queues |
| Bull | Background job queue (cron jobs) |
| JSON Web Tokens (JWT) | Authentication |
| bcryptjs | Password hashing |
| Cloudinary | Image upload & CDN |
| Multer | File upload middleware |
| Joi | Request validation |
| OpenAI SDK | AI recipe generation (GPT-4o) |
| PayPal REST API | Payment processing |
| Stripe SDK | Card payment processing |
| SendGrid | Transactional emails |
| Twilio | OTP via SMS |
| Firebase Admin | Push notifications (FCM) |
| node-cron | Scheduled background jobs |

### DevOps / Tooling
| Tool | Purpose |
|---|---|
| Nodemon | Auto-restart dev server |
| ESLint | Code linting |
| dotenv | Environment variable management |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  React 19 + Vite + Tailwind CSS + Socket.IO Client + Leaflet   │
└──────────────┬──────────────────────────────┬───────────────────┘
               │ HTTP (REST API)              │ WebSocket
               ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS 5 SERVER (Node.js)                    │
│                                                                 │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌─────────────┐ │
│  │  Routes   │  │ Controllers│  │ Services  │  │ Middlewares │ │
│  │ (REST)    │→ │ (Logic)    │→ │ (Business)│  │ (Auth/Err)  │ │
│  └──────────┘  └────────────┘  └───────────┘  └─────────────┘ │
│                                                                 │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ Socket.IO Server │  │  Bull Queues   │  │  node-cron     │  │
│  │ (Real-time)      │  │ (Background)   │  │ (Scheduled)    │  │
│  └──────────────────┘  └────────────────┘  └────────────────┘  │
└───────┬──────────────────┬──────────────────┬──────────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐
│   MongoDB    │  │    Redis     │  │  External Services       │
│  (Database)  │  │  (Cache/     │  │  - Cloudinary (Images)   │
│              │  │   Locks/     │  │  - PayPal (Payments)     │
│              │  │   Timers)    │  │  - Stripe (Payments)     │
│              │  │              │  │  - OpenAI (AI Recipes)   │
│              │  │              │  │  - SendGrid (Email)      │
│              │  │              │  │  - Twilio (SMS/OTP)      │
│              │  │              │  │  - Firebase (FCM Push)   │
└──────────────┘  └──────────────┘  └──────────────────────────┘
```

---

## 4. Project Directory Structure

```
QD-try/
├── Backend/
│   ├── server.js                    # Entry point
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── database.config.js   # MongoDB connection
│       │   ├── redis.config.js      # Redis connection
│       │   ├── cloudinary.config.js # Cloudinary setup
│       │   ├── stripe.config.js     # Stripe setup
│       │   ├── bullQueues.config.js # Bull job queues
│       │   └── rateLimit.config.js  # API rate limiting
│       ├── models/                  # Mongoose schemas (17 models)
│       ├── controllers/
│       │   ├── admin/               # Admin-side controllers (9)
│       │   ├── user/                # User-side controllers (10)
│       │   ├── shop/                # Public shop controllers (2)
│       │   └── agent/               # Delivery agent controllers (2)
│       ├── routes/
│       │   ├── admin/               # Admin API routes (9)
│       │   ├── user/                # User API routes (11)
│       │   ├── shop/                # Public shop routes (2)
│       │   ├── agent/               # Agent routes (1)
│       │   ├── otp.routes.js        # OTP authentication
│       │   └── location.route.js    # Geolocation
│       ├── services/                # Business logic services (12)
│       ├── middlewares/             # Auth, error, multer, rate-limit, validation
│       ├── validators/              # Joi validation schemas
│       ├── jobs/                    # Background cron jobs
│       └── utils/                   # Helpers (JWT, email, OTP, Cloudinary, etc.)
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx                  # Root router (all routes)
        ├── main.jsx                 # React entry point
        ├── index.css                # Global styles
        ├── context/                 # React Context providers (5)
        │   ├── AuthContext.jsx      # Auth state & JWT management
        │   ├── CartContext.jsx      # Shopping cart state
        │   ├── LocationContext.jsx  # User geolocation
        │   ├── PantryContext.jsx    # Pantry OS state
        │   └── ThemeContext.jsx     # Dark/Light mode
        ├── pages/                   # Page components (23)
        ├── component/
        │   ├── Auth/                # Login, Register, Verify, Reset, Protected
        │   ├── Layout/              # Navbar, Footer, AdminSidebar, DeliveryNavbar, PantryOSSidebar
        │   ├── UI/                  # ConfirmationModal, ReviewModal, ThemeToggle
        │   ├── Delivery/            # Delivery-specific components
        │   ├── Location/            # Location picker
        │   └── Pantry/              # Pantry-specific components
        ├── sections/
        │   └── pantry/              # PantrySection, CookTonightSection, ReorderSection
        └── services/                # API service modules (13)
```

---

## 5. Database Schema (17 Models)

### 5.1 User
| Field | Type | Description |
|---|---|---|
| name | String | Full name |
| email | String | Unique, lowercase |
| password | String | bcrypt hashed (select: false) |
| phone | String | Unique phone number |
| role | Enum | `user`, `admin`, `delivery` |
| isVerified | Boolean | Email verification status |
| fcmToken | String | Firebase push notification token |
| emailVerificationToken | String | For email verification flow |
| pendingEmail, emailChangeOtp | String | For email change via OTP |

### 5.2 Product
| Field | Type | Description |
|---|---|---|
| name, description, brand | String | Product info |
| price | Number | Base price |
| discount | Number | Discount percentage |
| images | Array | Cloudinary URLs with asset_id, public_id |
| category, subCategory | ObjectId[] | References to Category/SubCategory |
| stocks, reserved | Number | Inventory management |
| avgShelfLifeDays | Number | For pantry expiry calculation |
| pantryCategory | Enum | dairy, produce, grains, snacks, etc. |
| isPerishable | Boolean | Perishable flag |
| barcodeVariants | String[] | Barcode scanning support |
| sku | String | Stock keeping unit |

### 5.3 Order
| Field | Type | Description |
|---|---|---|
| user | ObjectId → User | Who placed the order |
| items | Array | Product, name, price, quantity, subtotal |
| shippingAddress | Embedded | fullName, phone, address, city, state, postalCode, lat/lng, country |
| paymentMethod | Enum | `cod`, `card`, `upi`, `wallet`, `paypal` |
| paymentStatus | Enum | `pending`, `paid`, `successful`, `failed`, `refunded` |
| paymentDetails | Embedded | Provider-specific details (PayPal orderId, Stripe intentId, etc.) |
| orderStatus | Enum | `PLACED` → `ASSIGNING` → `ACCEPTED` → `PICKED_UP` → `OUT_FOR_DELIVERY` → `DELIVERED` / `CANCELLED` / `NO_AGENT_AVAILABLE` |
| assignedAgent | ObjectId → DeliveryAgent | Assigned delivery agent |
| assignmentAttempts | ObjectId[] | Agents who were offered this order |
| inventory fields | Various | Lock timestamps for stock reservation |
| subtotal, discountTotal, totalAmount | Number | Price breakdown |

### 5.4 DeliveryAgent
| Field | Type | Description |
|---|---|---|
| name, email, phone, password | String | Agent credentials |
| profileImage | Object | Cloudinary image |
| age, address, aadharNumber | Various | Personal details |
| bikeName, bikeNumber | String | Vehicle info |
| isOnline, isAvailable | Boolean | Availability status |
| currentLocation | GeoJSON Point | GPS coordinates (2dsphere indexed) |
| pincode, deliveryPincodes, deliveryAreas | String/Array | Service areas |
| rating, totalReviews, totalDeliveries | Number | Performance metrics |
| activeOrder | ObjectId → Order | Currently assigned order |
| acceptanceRate | Number | % of accepted offers (0-100) |
| avgDeliveryTimeMs | Number | Average delivery time |
| recentAssignments | Number | For fairness scoring |

### 5.5 Other Models
| Model | Purpose |
|---|---|
| **Cart** | userId + productId + quantity (unique compound index) |
| **Address** | User saved addresses with lat/lng and labels |
| **Category / SubCategory** | Product categorization hierarchy |
| **PantryItem** | User's pantry inventory (name, quantity, unit, expiryDate, barcode, addedFrom: manual/scan/order_import) |
| **RecipeSuggestion** | Cached AI-generated recipes linked to pantry items |
| **ReorderPattern** | User reorder frequency patterns |
| **PendingReorder** | Scheduled reorder suggestions |
| **Review** | User reviews for delivery agents (rating 1-5 + comment) |
| **HelpTicket** | Support tickets (categories: Order Delayed, Wrong Item, Payment Issue, etc.; status: OPEN/IN_PROGRESS/RESOLVED/CLOSED) |
| **Notification** | In-app notifications (type: out_of_stock, order_update, delivery_update) |
| **AuditLog** | Admin action logging |

---

## 6. Authentication & Authorization Flow

```
User Registration → Email sent (SendGrid) → User clicks verify link
    → emailVerificationToken validated → isVerified = true → Login enabled

Login → Password compared (bcrypt) → JWT token generated → Stored in HTTP-only cookie
    → Every request: auth.middleware.js extracts JWT → verifies → attaches user to req

Password Reset → Forgot password → Token generated → Email sent → Reset link → New password saved

Role-based Access:
  - user: Shop, Cart, Orders, Profile, Pantry, Help Desk
  - admin: All admin routes (products, orders, agents, dashboard, categories, audit logs)
  - delivery: Delivery dashboard only (DeliveryGate component enforces this on frontend)
```

### Middleware Chain
1. **auth.middleware.js** — JWT verification, role checking
2. **rateLimit.middleware.js** — API rate limiting per IP
3. **validate.middleware.js** — Joi schema validation
4. **multer.middleware.js** — File upload handling
5. **error.middleware.js** — Centralized error handling with CustomError class

---

## 7. Core Feature Flows

### 7.1 Product Browsing & Shopping
1. User opens Home page → Products fetched from `/shop/products` with search, filters, pagination
2. Product cards show image, name, price, discount, add-to-cart button
3. ProductDetails page shows full info, multiple images, related products
4. Add to Cart → POST `/user/cart` → CartContext updates count in Navbar
5. Cart page shows items, quantity controls, price breakdown, address selection

### 7.2 Order Placement Flow
```
Cart → Select Address → Choose Payment Method
  ├── COD → Order created directly (status: PLACED)
  ├── PayPal → Create PayPal order → User approves on PayPal → Capture payment → Order created
  └── Stripe → Create Payment Intent → Card UI (Stripe Elements) → Confirm payment → Order created

After order created:
  → Inventory locked (reserved field incremented)
  → Order Assignment Engine triggered
  → User redirected to OrderSuccess page
  → Real-time tracking begins
```

### 7.3 Intelligent Order Assignment Engine
This is the most complex system in the project. Located in `orderAssignment.service.js`:

```
Order Placed
    │
    ▼
Find Eligible Agents (MongoDB geospatial query)
  - isOnline: true, isAvailable: true, activeOrder: null
  - Not in assignmentAttempts (previously rejected/timed out)
  - Within ASSIGNMENT_RADIUS_KM of store (GeoJSON $near query)
  - Matching pincode
    │
    ▼
Score & Rank Agents (Multi-factor scoring):
  - Distance Score (50% weight) — Haversine distance to store
  - Performance Score (30% weight) — Average delivery time
  - Acceptance Score (10% weight) — Historical acceptance rate
  - Fairness Score (10% weight) — Recent assignment count
  → Lower total score = better agent
    │
    ▼
Acquire Agent Lock (Redis SET NX / in-memory fallback)
  → Prevents concurrent assignment of same agent
    │
    ▼
Send WebSocket event "newOrder" to agent's private socket
    │
    ▼
Start 30-second timer (Redis sorted set / in-memory setTimeout)
    │
    ├── Agent ACCEPTS → orderStatus=ACCEPTED, agent.activeOrder=orderId
    │                    → Notify user via Socket "orderAccepted"
    │                    → Release agent lock
    │
    ├── Agent REJECTS → Update acceptance rate, add to assignmentAttempts
    │                    → Release lock → Reassign to next best agent
    │
    └── TIMEOUT (30s) → Release lock → Reassign to next best agent
                         → If no agents left → orderStatus=NO_AGENT_AVAILABLE
                         → Notify user via Socket + in-app notification
```

### 7.4 Live Order Tracking
```
Order Accepted
    │
    ▼
Agent updates status: PICKED_UP → OUT_FOR_DELIVERY → DELIVERED
    │
    ▼ (Each status change)
Socket.IO emits to user's room: "orderStatusUpdate"
Agent shares GPS location: Socket emits "agentLocationUpdate"
    │
    ▼
Frontend: OrderDetails page shows Leaflet map with agent marker
  - Real-time position updates
  - Order timeline with status progression
  - Agent info card (name, phone, rating)
```

### 7.5 Pantry OS (Smart Kitchen Management)
Three sub-modules accessed via tabbed navigation:

**a) Pantry Management**
- Add items manually or via barcode scan (@zxing/library)
- Auto-import items from delivered orders
- Track quantities, expiry dates, categories
- Expiry alert cron job (expiryAlert.job.js) sends notifications for items expiring soon

**b) Cook Tonight (AI Recipes)**
- Select pantry items → Send to backend → OpenAI GPT-4o generates recipe
- Returns: title, ingredients list, step-by-step instructions
- Recipes cached in RecipeSuggestion model

**c) Smart Reorder**
- Analyzes order history patterns (ReorderPattern model)
- Suggests items to reorder based on frequency
- Auto-reorder cron job (autoReorder.job.js) creates PendingReorder entries
- User can approve and add to cart

### 7.6 Payment Integration

**PayPal Flow:**
```
Frontend: User selects PayPal → Backend creates PayPal order (INR→USD conversion)
  → PayPal SDK renders buttons → User logs in to PayPal → Approves
  → Backend captures payment → Verifies → Creates order in DB
  
- Exchange rate configurable via PAYPAL_USD_RATE env var
- Sandbox/Live mode toggle via PAYPAL_MODE
- Access token cached with auto-refresh
```

**Stripe Flow:**
```
Frontend: User selects Card → Backend creates Payment Intent
  → Stripe Elements renders card form → User submits
  → Backend confirms payment → Creates order in DB
```

### 7.7 Admin Panel
Full admin dashboard with sidebar navigation:

| Page | Features |
|---|---|
| **Dashboard** | Analytics cards (users, orders, revenue, agents), Chart.js graphs, area-wise data |
| **Products** | CRUD with image upload (Cloudinary), search, filters, pagination |
| **Add Product** | Multi-image upload, category/subcategory selection, inventory fields |
| **Categories** | Manage categories & subcategories |
| **Orders** | View all orders, filter by status, update status |
| **Agents** | View all delivery agents, performance metrics, edit details |
| **Create Agent** | Register new delivery agents with profile image |
| **Help Tickets** | View/respond to user support tickets, update status/priority |
| **Audit Logs** | Track all admin actions (who did what, when) |

### 7.8 Delivery Agent Dashboard
- Login with agent credentials
- Toggle online/offline status
- Receive real-time order notifications via Socket.IO
- Accept/Reject orders within 30-second window
- Update order status through delivery flow
- Share live GPS location
- View delivery history and performance stats
- Profile management

### 7.9 Help Desk System
- Users submit tickets with category, message, optional order reference
- Categories: Order Delayed, Wrong Item, Payment Issue, Refund, Agent Behavior, Technical, Other
- Priority levels: LOW, MEDIUM, HIGH
- Status flow: OPEN → IN_PROGRESS → RESOLVED → CLOSED
- Admin responds and manages tickets from admin panel

### 7.10 Notification System
- **In-app notifications** stored in MongoDB (Notification model)
- **Real-time push** via Socket.IO events
- **FCM push notifications** via Firebase Admin SDK
- Types: order updates, delivery updates, out-of-stock alerts, agent assignment
- Notification bell in Navbar with unread count badge

---

## 8. Real-Time Architecture (Socket.IO)

```
Client connects → Authenticates → Joins user-specific room

Events:
  Server → Client:
    - "newOrder"              (to specific agent socket)
    - "orderAccepted"         (to user room)
    - "orderStatusUpdate"     (to user room)
    - "agentLocationUpdate"   (to user room)
    - "noAgentAvailable"      (to user room)
    - "notification"          (to user room)

  Client → Server:
    - "acceptOrder"           (agent accepts assignment)
    - "rejectOrder"           (agent rejects assignment)
    - "updateLocation"        (agent shares GPS)
    - "goOnline" / "goOffline"(agent availability toggle)

Presence Service (presence.service.js):
  - Tracks which agents are connected and their socket IDs
  - Maps agent IDs to socket IDs for private messaging
  - getUserRoom() creates user-specific rooms for targeted events
```

---

## 9. Background Jobs & Cron Tasks

| Job | Schedule | Description |
|---|---|---|
| **expiryAlert.job.js** | Daily cron | Scans pantry items with upcoming expiry dates, sends notifications |
| **autoReorder.job.js** | Periodic cron | Analyzes reorder patterns, creates pending reorder suggestions |
| **Inventory Lock Cleanup** | Via order status checks | Releases reserved stock for expired/cancelled orders |
| **Order Timer (Redis)** | 30s per assignment | Auto-reassigns order if agent doesn't respond |

---

## 10. API Route Map

### Public (Shop) Routes — `/shop/`
- `GET /products` — Browse with search, filter, sort, pagination
- `GET /products/:id` — Product details
- `GET /categories` — All categories with subcategories

### User Routes — `/user/`
- **Auth**: Register, Login, Logout, Verify Email, Forgot/Reset Password, OTP
- **Profile**: Get/Update profile, Change email (OTP), Change password, Upload image
- **Cart**: Add/Remove/Update items, Get cart
- **Address**: CRUD operations for saved addresses
- **Orders**: Place order, Get my orders, Get order details, Cancel order, PayPal/Stripe payment flows
- **Pantry**: Add/Get/Update/Delete pantry items, Import from order
- **Recipes**: Generate AI recipe from pantry items, Get saved recipes
- **Reorder**: Get reorder suggestions, Approve reorder
- **Reviews**: Submit delivery agent review
- **Help**: Create/Get support tickets
- **Notifications**: Get notifications, Mark as read

### Admin Routes — `/admin/`
- **Dashboard**: Analytics data (aggregated stats)
- **Products**: CRUD with image upload
- **Categories/SubCategories**: CRUD
- **Orders**: List all, update status
- **Delivery Agents**: CRUD, performance data
- **Help Tickets**: List all, respond, update status
- **Users**: List, manage
- **Audit Logs**: View admin action history

### Agent Routes — `/agent/`
- Auth (login)
- Accept/Reject order
- Update order status (PICKED_UP, OUT_FOR_DELIVERY, DELIVERED)
- Update location
- Toggle online/offline
- Cancel accepted order (affects performance score)
- Get active & past orders

---

## 11. Frontend Routing Map

| Path | Component | Access |
|---|---|---|
| `/` | Home | Public |
| `/cart` | Cart | Public |
| `/product/:id` | ProductDetails | Public |
| `/register` | Registration | Public |
| `/login` | Login | Public |
| `/verify-email/:token` | VerifyEmail | Public |
| `/forgot-password` | ForgotPassword | Public |
| `/reset-password/:token` | ResetPassword | Public |
| `/profile` | MyProfile | User |
| `/orders` | MyOrders | User |
| `/order/:id` | OrderDetails | User |
| `/order-success` | OrderSuccess | User |
| `/addresses` | MyAddresses | User |
| `/help` | HelpDesk | User |
| `/pantry-os/pantry` | PantrySection | Protected |
| `/pantry-os/cook` | CookTonightSection | Protected |
| `/pantry-os/reorder` | ReorderSection | Protected |
| `/admin/dashboard` | AdminDashboard | Admin |
| `/admin/products` | AdminProducts | Admin |
| `/admin/products/new` | AdminAddProduct | Admin |
| `/admin/categories` | AdminCategories | Admin |
| `/admin/orders` | AdminOrders | Admin |
| `/admin/agents` | AdminAgents | Admin |
| `/admin/delivery-agent/new` | AdminCreateDeliveryAgent | Admin |
| `/admin/help-tickets` | AdminHelpTickets | Admin |
| `/admin/audit-logs` | AdminAuditLogs | Admin |
| `/delivery/dashboard` | DeliveryDashboard | Agent |

---

## 12. State Management (React Context)

| Context | State Managed |
|---|---|
| **AuthContext** | User object, JWT token, login/logout/register functions, auth loading state |
| **CartContext** | Cart items, add/remove/update functions, cart count for Navbar badge |
| **LocationContext** | User's GPS coordinates, address resolution, location permission |
| **PantryContext** | Pantry items list, add/remove/update functions |
| **ThemeContext** | Dark/Light mode toggle, persisted to localStorage |

---

## 13. Security Measures

- **Password Hashing**: bcryptjs with salt rounds of 10
- **JWT Authentication**: Tokens in HTTP-only cookies, expiration enforced
- **Email Verification**: Crypto-generated tokens with 15-minute expiry
- **Password Reset**: Separate tokens with 5-minute expiry
- **Rate Limiting**: Per-IP rate limiting on sensitive endpoints (login, OTP)
- **Input Validation**: Joi schemas on all user inputs
- **CORS**: Configured for frontend origin only
- **File Upload**: Multer with file type/size restrictions
- **Agent Locking**: Redis-based distributed locks prevent double-assignment
- **Inventory Reservation**: Stock locked during order processing to prevent overselling

---

## 14. Environment Variables Required

```env
# Database
MONGODB_URI=
REDIS_URL=

# Auth
JWT_SECRET=
JWT_EXPIRE=

# Email (SendGrid)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# SMS (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Image Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Payments
PAYPAL_CLIENT_ID=
PAYPAL_SECRET_ID=
PAYPAL_MODE=sandbox
PAYPAL_USD_RATE=83
PAYPAL_CURRENCY=USD
STRIPE_SECRET_KEY=

# AI
OPENAI_API_KEY=

# Firebase
FIREBASE_SERVICE_ACCOUNT=

# Store Location (for agent assignment)
STORE_LAT=
STORE_LON=
ASSIGNMENT_RADIUS_KM=5

# App
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

---

## 15. How to Run the Project

```bash
# 1. Clone the repository
git clone <repo-url>

# 2. Backend setup
cd Backend
npm install
# Create .env file with all variables listed above
npm start          # Starts with nodemon on port 5000

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev        # Starts Vite dev server on port 5173

# 4. Required services
# - MongoDB (local or Atlas)
# - Redis (local or cloud)
```

---

## 16. Key Design Patterns Used

1. **MVC Architecture** — Models, Controllers (+ Services), Views (React)
2. **Service Layer Pattern** — Business logic separated from controllers
3. **Repository Pattern** — Mongoose models abstract database operations
4. **Observer Pattern** — Socket.IO event-driven communication
5. **Middleware Chain** — Express middleware for cross-cutting concerns
6. **Context API Pattern** — React Context for global state management
7. **Protected Routes** — HOC wrapper for role-based route access
8. **Scoring Algorithm** — Multi-weighted agent scoring for intelligent assignment
9. **Distributed Locking** — Redis SET NX for concurrent agent assignment prevention
10. **Job Queue Pattern** — Bull + node-cron for background processing

---

*This documentation covers the complete Quick Drop project. Use it as reference for project reports, presentations, or onboarding new developers.*
