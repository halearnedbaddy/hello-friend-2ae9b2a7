# SWIFTLINE → PAYINGZEE × POSTCART Implementation Plan

## 📋 Current State Analysis

### ✅ What's Already Built (DO NOT MODIFY)

#### Authentication & User Management
- ✅ OTP-based phone authentication
- ✅ User roles: BUYER, SELLER, ADMIN
- ✅ JWT token system (access + refresh tokens)
- ✅ User profiles and verification
- ✅ Session management

#### Transaction System (Escrow-Based)
- ✅ Transaction creation with payment links
- ✅ Transaction status flow: PENDING → PROCESSING → PAID → ACCEPTED → SHIPPED → DELIVERED → COMPLETED
- ✅ Payment link generation: `/pay/:transactionId`
- ✅ M-Pesa STK Push integration
- ✅ Payment callbacks and confirmation
- ✅ Transaction history and tracking

#### Wallet System
- ✅ Wallet creation per user
- ✅ Available balance, pending balance tracking
- ✅ Withdrawal system with payment methods
- ✅ Withdrawal history
- ✅ Fee calculation (platform fees)

#### Seller Features
- ✅ Seller dashboard (`/seller`)
- ✅ Order management (accept/reject orders)
- ✅ Shipping information management
- ✅ Seller statistics
- ✅ Link generator for payment links
- ✅ Seller profile management

#### Buyer Features
- ✅ Buyer dashboard (`/buyer`)
- ✅ Order tracking
- ✅ Dispute management
- ✅ Activity history
- ✅ Wallet top-up

#### Admin Features
- ✅ Admin dashboard (`/admin`)
- ✅ User management
- ✅ Transaction monitoring
- ✅ Dispute resolution
- ✅ Platform statistics

#### Notifications
- ✅ Real-time notifications via Socket.IO
- ✅ Notification types: payment, order status, disputes, etc.
- ✅ In-app notification bell
- ✅ Notification history

#### Payment Integration
- ✅ M-Pesa STK Push (Lipa na M-Pesa)
- ✅ M-Pesa B2C (payouts to sellers)
- ✅ Payment status tracking
- ✅ Payment callbacks

---

## 🎯 What Needs to Be Added (NEW COMMERCE LAYER)

### 1️⃣ Store Entity (NEW)

**Database Schema Addition:**
```prisma
model Store {
  id              String   @id @default(uuid())
  sellerId        String   @unique
  name            String
  slug            String   @unique
  logo            String?
  bio             String?
  status          StoreStatus @default(INACTIVE)
  payoutMethodId  String?  // Must be set for store to go live
  
  // Social Page Connection
  connectedInstagramPage  String?
  connectedFacebookPage   String?
  lastSyncAt              DateTime?
  syncStatus              SyncStatus @default(IDLE)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  seller          User     @relation(fields: [sellerId], references: [id])
  products        Product[]
  syncLogs        StoreSyncLog[]
  
  @@index([slug])
  @@index([status])
}

enum StoreStatus {
  INACTIVE
  LIVE
  SUSPENDED
}

enum SyncStatus {
  IDLE
  RUNNING
  SUCCESS
  FAILED
}
```

**API Endpoints Needed:**
- `POST /api/v1/stores` - Create store
- `GET /api/v1/stores/me` - Get seller's store
- `PUT /api/v1/stores/me` - Update store
- `GET /api/v1/stores/:slug` - Public store view (no auth)
- `POST /api/v1/stores/me/go-live` - Activate store (requires payout method)
- `GET /api/v1/stores/me/sync-status` - Get sync status

**Frontend Components Needed:**
- Store setup form in seller dashboard
- Store settings page
- Store preview component

---

### 2️⃣ Product Entity (NEW)

**Database Schema Addition:**
```prisma
model Product {
  id              String   @id @default(uuid())
  storeId         String
  name            String
  price           Float
  description     String?
  images          String[] @default([])
  status          ProductStatus @default(DRAFT)
  source          ProductSource @default(MANUAL)
  
  // Social Post Reference (if AI-created)
  socialPostId    String?
  socialPostUrl   String?
  socialPlatform  String?  // 'instagram' | 'facebook'
  
  // AI Metadata
  aiCreatedAt     DateTime?
  aiLastUpdatedAt DateTime?
  needsReview     Boolean  @default(false)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  store           Store    @relation(fields: [storeId], references: [id])
  transactions    Transaction[] // Link to existing transactions
  
  @@index([storeId])
  @@index([status])
  @@index([slug])
}

enum ProductStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum ProductSource {
  MANUAL
  INSTAGRAM
  FACEBOOK
}
```

**API Endpoints Needed:**
- `POST /api/v1/products` - Create product (manual)
- `GET /api/v1/products` - List products (filtered by store, status)
- `GET /api/v1/products/:id` - Get product details
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Archive product
- `POST /api/v1/products/:id/publish` - Publish product
- `GET /api/v1/stores/:slug/products` - Public product list (no auth)

**Frontend Components Needed:**
- Product creation form
- Product list/grid view
- Product detail page
- Product management in seller dashboard

---

### 3️⃣ Public Store Frontend (NEW)

**Routes Needed:**
- `/store/:slug` - Public store page
- `/store/:slug/product/:productId` - Product detail page

**Components Needed:**
- `PublicStorePage.tsx` - Store landing page
- `ProductGrid.tsx` - Product listing
- `ProductDetailPage.tsx` - Product detail with buy button
- Integration with existing payment flow

**Flow:**
1. Buyer visits `/store/:slug`
2. Sees store branding + product grid
3. Clicks product → `/store/:slug/product/:productId`
4. Clicks "Buy Now" → redirects to existing payment flow
5. Creates transaction linked to product (not standalone)

---

### 4️⃣ Social Page Connection (NEW)

**Database Addition:**
- Store model already includes `connectedInstagramPage` and `connectedFacebookPage`

**API Endpoints Needed:**
- `POST /api/v1/stores/me/connect-instagram` - Connect Instagram page
- `POST /api/v1/stores/me/connect-facebook` - Connect Facebook page
- `DELETE /api/v1/stores/me/disconnect-social` - Disconnect social page
- `GET /api/v1/stores/me/social-connection` - Get connection status

**Frontend Components Needed:**
- Social connection UI in seller dashboard
- Connection status indicator
- Disconnect button

**Third-Party Integration:**
- Instagram Basic Display API or Graph API
- Facebook Graph API
- OAuth flow for page access

---

### 5️⃣ AI Initial Scan (NEW)

**API Endpoint Needed:**
- `POST /api/v1/stores/me/ai-scan` - Trigger initial AI scan

**Background Process:**
- Fetch all posts from connected social page
- Use AI/ML to extract:
  - Product name
  - Price (if mentioned)
  - Description
  - Images
- Create products with status = DRAFT
- Log all actions in StoreSyncLog

**AI Governance:**
- ✅ Can create draft products
- ✅ Can update drafts
- ✅ Can flag changes
- ❌ Cannot publish products
- ❌ Cannot change prices without review
- ❌ Cannot delete products
- ❌ Cannot touch payments/wallets

---

### 6️⃣ Continuous Auto-Sync (NEW)

**Background Job/Service:**
- Periodic sync (e.g., every 6 hours)
- Incremental change detection

**Sync Logic:**
- New post → Create draft product
- Deleted post → Archive corresponding product
- Updated post → Update product + set `needsReview = true`

**Database Addition:**
```prisma
model StoreSyncLog {
  id          String   @id @default(uuid())
  storeId     String
  syncType    String   // 'initial' | 'incremental'
  status      String   // 'success' | 'failed'
  productsFound Int
  productsCreated Int
  productsUpdated Int
  error       String?
  startedAt   DateTime
  completedAt DateTime?
  
  store       Store    @relation(fields: [storeId], references: [id])
}
```

**API Endpoints:**
- `GET /api/v1/stores/me/sync-logs` - View sync history
- `POST /api/v1/stores/me/trigger-sync` - Manual sync trigger

---

### 7️⃣ Product-to-Transaction Link (MODIFY EXISTING)

**Modification Needed:**
- Add `productId` field to Transaction model (optional, for backward compatibility)
- When buyer purchases from product page, create transaction with `productId`
- Existing transaction links (without productId) must still work

**Database Addition:**
```prisma
// In Transaction model, add:
productId      String?
product        Product? @relation(fields: [productId], references: [id])
```

---

### 8️⃣ Fee Transparency (EXTEND EXISTING)

**Already Exists:**
- Transaction has `platformFee` and `sellerPayout` fields
- Wallet tracks balances

**Enhancement Needed:**
- Ensure fee breakdown is visible in seller transaction history
- Add fee breakdown to transaction details API response
- Display in seller dashboard transaction list

---

### 9️⃣ Seller Onboarding Enforcement (UX)

**Frontend Logic:**
- Check if seller has payout method before allowing store to go live
- Show clear message: "Add payout method to go live"
- Disable "Go Live" button if no payout method
- Block public store page if status = INACTIVE

**API Logic:**
- `POST /api/v1/stores/me/go-live` endpoint must check for payout method
- Return error if no payout method exists

---

### 🔟 Admin Extensions (OPTIONAL)

**New Admin Features:**
- View all stores: `/admin/stores`
- View store sync status
- Manually disable store
- Retry failed AI scans
- View AI action logs

**API Endpoints:**
- `GET /api/v1/admin/stores` - List all stores
- `PUT /api/v1/admin/stores/:id/status` - Update store status
- `POST /api/v1/admin/stores/:id/retry-sync` - Retry sync

---

## 📝 Implementation Checklist

### Phase 1: Database Schema
- [ ] Add Store model to Prisma schema
- [ ] Add Product model to Prisma schema
- [ ] Add StoreSyncLog model to Prisma schema
- [ ] Add productId to Transaction model (optional field)
- [ ] Run Prisma migration
- [ ] Generate Prisma client

### Phase 2: Backend API - Store Management
- [ ] Create store controller
- [ ] Create store routes
- [ ] Implement store CRUD operations
- [ ] Implement store status management
- [ ] Add payout method validation
- [ ] Test store endpoints

### Phase 3: Backend API - Product Management
- [ ] Create product controller
- [ ] Create product routes
- [ ] Implement product CRUD operations
- [ ] Implement product status management (draft/publish/archive)
- [ ] Link products to transactions
- [ ] Test product endpoints

### Phase 4: Social Page Connection
- [ ] Research Instagram/Facebook API requirements
- [ ] Implement OAuth flow for Instagram
- [ ] Implement OAuth flow for Facebook
- [ ] Store connection tokens securely
- [ ] Create connection management endpoints
- [ ] Test social connections

### Phase 5: AI Integration
- [ ] Set up AI service (OpenAI/Claude/etc.)
- [ ] Implement initial page scan
- [ ] Implement product extraction logic
- [ ] Create draft products from AI scan
- [ ] Implement AI governance
- [ ] Log all AI actions
- [ ] Test AI scanning

### Phase 6: Auto-Sync Service
- [ ] Create background job service
- [ ] Implement incremental sync logic
- [ ] Detect new posts
- [ ] Detect deleted posts
- [ ] Detect updated posts
- [ ] Create sync logs
- [ ] Test sync service

### Phase 7: Public Store Frontend
- [ ] Create `/store/:slug` route
- [ ] Build PublicStorePage component
- [ ] Build ProductGrid component
- [ ] Create `/store/:slug/product/:productId` route
- [ ] Build ProductDetailPage component
- [ ] Integrate with existing payment flow
- [ ] Test public store pages

### Phase 8: Seller Dashboard Extensions
- [ ] Add "Store" tab to seller dashboard
- [ ] Build store setup form
- [ ] Build store settings page
- [ ] Add product management section
- [ ] Add social connection UI
- [ ] Add sync status display
- [ ] Add product review queue (needsReview flag)
- [ ] Test seller dashboard extensions

### Phase 9: Fee Transparency
- [ ] Enhance transaction API to include fee breakdown
- [ ] Update seller transaction list to show fees
- [ ] Add fee breakdown component
- [ ] Test fee display

### Phase 10: Admin Extensions
- [ ] Add stores section to admin dashboard
- [ ] Build store list view
- [ ] Add store management actions
- [ ] Add sync log viewer
- [ ] Add manual sync trigger
- [ ] Test admin extensions

### Phase 11: Testing & Polish
- [ ] End-to-end testing of store creation
- [ ] End-to-end testing of product creation
- [ ] End-to-end testing of social connection
- [ ] End-to-end testing of AI scan
- [ ] End-to-end testing of auto-sync
- [ ] End-to-end testing of public store purchase flow
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation

---

## 🚨 Critical Constraints

### DO NOT MODIFY:
- ❌ Authentication system
- ❌ OTP system
- ❌ User roles
- ❌ Existing dashboards structure
- ❌ Payment system
- ❌ Wallet credit logic
- ❌ Admin transaction views
- ❌ Buyer accounts
- ❌ M-Pesa integration
- ❌ Notification system structure

### MUST PRESERVE:
- ✅ All existing API endpoints
- ✅ All existing routes
- ✅ All existing database models (except additions)
- ✅ All existing business logic
- ✅ Backward compatibility with transaction links

---

## 📊 Progress Tracking

**Current Status:** Planning Phase
**Started:** [Date to be filled]
**Target Completion:** [Date to be filled]

**Completed:**
- [x] Requirements analysis
- [x] Implementation plan documentation

**In Progress:**
- [ ] Database schema design
- [ ] Backend API development
- [ ] Frontend development

**Blocked:**
- [ ] None currently

**Remaining:**
- [ ] All implementation phases (see checklist above)

---

## 🔄 Next Steps

1. Review and approve this implementation plan
2. Set up development environment
3. Begin Phase 1: Database Schema
4. Follow checklist sequentially
5. Update this document as work progresses

---

## 📝 Notes

- All new features must be additive, not destructive
- Maintain backward compatibility at all times
- Test thoroughly before moving to next phase
- Document all API changes
- Keep this file updated with progress

---

## 🧠 ADDITIONAL REQUIRED IMPLEMENTATION (SAFETY, GROWTH & SCALE)

### ⚠️ Critical Missing Pieces Identified

The following additions must be implemented without modifying any existing or planned logic, and must remain fully optional and backward-compatible.

---

### 1️⃣ STORE VISIBILITY & DISCOVERY PREP

**Database Addition:**
```prisma
// In Store model, add:
visibility        StoreVisibility @default(PRIVATE)
optInToDiscovery Boolean        @default(false)

enum StoreVisibility {
  PRIVATE  // Only accessible via direct link
  PUBLIC   // Eligible for discovery (future feature)
}
```

**Rules:**
- Seller must explicitly opt-in to PUBLIC visibility
- No global marketplace or ranking logic (yet)
- Purpose: prepare for future store discovery without changing core model
- Default: PRIVATE (only direct link access)

**API Endpoints:**
- `PUT /api/v1/stores/me/visibility` - Update visibility (requires explicit opt-in)
- `GET /api/v1/stores/:slug` - Public access works regardless of visibility (direct link)

**Frontend:**
- Add visibility toggle in store settings
- Clear messaging about what PUBLIC means
- Opt-in checkbox with explanation

---

### 2️⃣ PRODUCT AVAILABILITY SIGNALS (NO INVENTORY)

**Database Addition:**
```prisma
// In Product model, add:
isAvailable       Boolean  @default(true)
availabilityNote  String?  // e.g., "DM before order", "Limited stock", "Pre-order"
```

**Rules:**
- Used only for UI messaging and checkout warnings
- No inventory management logic
- Prevents payment disputes
- Social sellers frequently pause sales

**API Enhancement:**
- Filter products by `isAvailable` in public store view
- Show availability note in product detail page
- Block checkout if `isAvailable = false` (show message)

**Frontend:**
- Display availability badge on products
- Show availability note in product detail
- Disable "Buy Now" button if unavailable
- Clear messaging: "This product is currently unavailable"

---

### 3️⃣ LINK PREVIEW & SEO METADATA

**Implementation Required:**

**Backend API Endpoints:**
- `GET /api/v1/stores/:slug/meta` - Returns OpenGraph metadata
- `GET /api/v1/products/:id/meta` - Returns product OpenGraph metadata

**Metadata Fields:**
```typescript
interface StoreMeta {
  title: string
  description: string
  image: string  // Store logo or default
  url: string
  type: 'website'
}

interface ProductMeta {
  title: string  // Product name
  description: string  // Product description
  image: string  // First product image
  url: string
  type: 'product'
  price: number
  currency: string
}
```

**Frontend Implementation:**
- Add `<meta>` tags to public store page
- Add `<meta>` tags to product detail page
- Generate dynamic OG images (store logo + product image)
- Ensure WhatsApp/Instagram previews work correctly

**Rules:**
- Must work without buyer accounts
- Must be server-side rendered or dynamically injected
- Images must be absolute URLs

---

### 4️⃣ AI CONFIDENCE & QUALITY SIGNALS

**Database Addition:**
```prisma
// In Product model, add:
aiConfidenceScore Float?   // 0.0 to 1.0
extractionWarnings String[] @default([])  // e.g., ["Price unclear", "No images found"]
missingFields      String[] @default([])  // e.g., ["description", "price"]
```

**Rules:**
- AI sets confidence score during extraction
- Warnings indicate potential issues
- Missing fields indicate incomplete data
- Display in seller review UI

**API Enhancement:**
- Include confidence score in product API responses
- Include warnings in product details
- Filter products by confidence in seller dashboard

**Frontend:**
- Show confidence badge in product list
- Display warnings prominently in review UI
- Highlight missing fields
- Allow seller to see why AI flagged issues

**AI Service Logic:**
- Calculate confidence based on:
  - Price extraction success
  - Image detection
  - Description quality
  - Completeness of data

---

### 5️⃣ FRAUD & RISK SIGNAL LOGGING (NO BUYER ACCOUNTS)

**Database Addition:**
```prisma
model FraudSignal {
  id                String   @id @default(uuid())
  transactionId     String?
  storeId           String?
  deviceFingerprint String?
  ipAddress         String?
  ipReputationScore Float?   // 0.0 to 1.0 (1.0 = clean)
  paymentVelocity   Int      @default(0)  // Payments in last 24h
  riskScore         Float    @default(0)  // 0.0 to 1.0 (1.0 = high risk)
  flags             String[] @default([])  // e.g., ["high_velocity", "suspicious_ip"]
  createdAt         DateTime @default(now())
  
  transaction      Transaction? @relation(fields: [transactionId], references: [id])
  store            Store?       @relation(fields: [storeId], references: [id])
  
  @@index([transactionId])
  @@index([storeId])
  @@index([riskScore])
}

// In Store model, add:
riskScore          Float    @default(0)
lastRiskCheck      DateTime?
```

**Rules:**
- Passive logging only (no user blocking)
- Seller/store-level controls only
- Admin can view risk signals
- Used for fraud training and admin decisions

**API Endpoints:**
- `POST /api/v1/fraud/signal` - Log fraud signal (internal)
- `GET /api/v1/admin/stores/:id/risk` - View risk signals
- `GET /api/v1/admin/fraud-signals` - List all fraud signals

**Implementation:**
- Capture device fingerprint on payment initiation
- Check IP reputation via third-party service
- Track payment velocity per device/IP
- Calculate risk score algorithmically
- Store signals for analysis

**Frontend:**
- Admin dashboard: risk score display
- Admin dashboard: fraud signal viewer
- No buyer-facing UI (account-less)

---

### 6️⃣ PROMOTION ENGINE (ACCOUNT-LESS)

**Database Addition:**
```prisma
model Promotion {
  id              String   @id @default(uuid())
  storeId         String?
  productId       String?
  code            String?  @unique  // For link-based promos
  type            PromotionType
  discountType    DiscountType
  discountValue   Float    // Percentage or fixed amount
  minPurchase     Float?   // Minimum purchase amount
  maxDiscount     Float?   // Maximum discount cap
  startDate       DateTime
  endDate         DateTime?
  isActive        Boolean  @default(true)
  usageLimit      Int?     // Total usage limit
  usageCount      Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  store           Store?    @relation(fields: [storeId], references: [id])
  product         Product?  @relation(fields: [productId], references: [id])
  transactions    Transaction[]
  
  @@index([code])
  @@index([storeId])
  @@index([isActive])
}

enum PromotionType {
  STORE_WIDE    // Applies to all products in store
  PRODUCT       // Applies to specific product
  LINK_BASED    // Code-based promo
  FEE_DISCOUNT  // Platform fee discount (admin only)
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}
```

**Rules:**
- No buyer login required
- Promo codes can be shared via link
- Fee discounts are platform-controlled (admin only)
- Store/product discounts are seller-controlled

**API Endpoints:**
- `POST /api/v1/stores/me/promotions` - Create promotion
- `GET /api/v1/stores/me/promotions` - List store promotions
- `GET /api/v1/promotions/validate` - Validate promo code (public)
- `POST /api/v1/admin/promotions` - Create fee discount (admin)

**Transaction Integration:**
- Apply promotion during checkout
- Store promotion ID in transaction
- Calculate discounted amount
- Apply fee discount if applicable

**Frontend:**
- Seller: promotion management UI
- Public: promo code input on checkout
- Display discount in payment page
- Admin: fee discount management

---

### 7️⃣ AI SYNC FAILURE RULES

**Database Addition:**
```prisma
// In Store model, add:
syncFailureCount    Int       @default(0)
syncDisabledUntil   DateTime? // Auto-disable until this date
lastSyncError       String?
maxSyncFailures     Int       @default(5)  // Configurable threshold
```

**Rules:**
- Track consecutive sync failures
- Auto-disable sync after threshold (e.g., 5 failures)
- Notify seller on sync failure
- Admin can override and retry

**Implementation Logic:**
```typescript
// Pseudo-code
if (syncFailureCount >= maxSyncFailures) {
  syncDisabledUntil = now() + 24 hours
  notifySeller('Sync disabled due to repeated failures')
  createAdminAlert('Store sync disabled', storeId)
}

// Admin can:
- Reset failure count
- Clear disabledUntil
- Trigger manual retry
```

**API Endpoints:**
- `GET /api/v1/stores/me/sync-status` - Include failure count
- `POST /api/v1/stores/me/reset-sync` - Reset failure count (seller)
- `POST /api/v1/admin/stores/:id/reset-sync` - Admin override
- `POST /api/v1/admin/stores/:id/retry-sync` - Admin retry

**Frontend:**
- Display sync status with failure count
- Show warning when approaching threshold
- Display disabled message if sync disabled
- Admin: sync management controls

**Notification:**
- Email/SMS to seller on sync failure
- In-app notification
- Admin dashboard alert

---

### 8️⃣ SOURCE OF TRUTH RULES (VERY IMPORTANT)

**Explicit Rules Must Be Documented:**

1. **Manual Seller Edits Override AI:**
   - If seller manually edits a product, AI cannot overwrite those fields
   - Track which fields were manually edited
   - AI can only update fields that were AI-created and never manually edited

2. **AI Can Suggest But Never Overwrite Published:**
   - If product is PUBLISHED, AI updates create a "suggestion" flag
   - Seller must review and approve AI suggestions
   - AI cannot auto-update published products

3. **AI Updates Always Require Review:**
   - All AI updates set `needsReview = true`
   - Seller sees products needing review in dashboard
   - Seller can accept/reject AI suggestions

**Database Addition:**
```prisma
// In Product model, add:
manuallyEditedFields String[] @default([])  // e.g., ["name", "price", "description"]
aiSuggestions        Json?    // Store AI suggestions for review
lastAiSuggestionAt   DateTime?
```

**Implementation Logic:**
```typescript
// When AI tries to update product:
if (product.status === 'PUBLISHED') {
  // Don't update directly
  // Create suggestion instead
  product.aiSuggestions = {
    name: aiExtractedName,
    price: aiExtractedPrice,
    // ... other fields
  }
  product.needsReview = true
  product.lastAiSuggestionAt = now()
}

// When seller manually edits:
product.manuallyEditedFields.push('name')  // Track edited field
product.needsReview = false  // Clear review flag

// When AI tries to update:
if (product.manuallyEditedFields.includes('name')) {
  // Skip updating 'name' field - seller owns it
}
```

**API Endpoints:**
- `GET /api/v1/products?needsReview=true` - Products needing review
- `POST /api/v1/products/:id/accept-suggestion` - Accept AI suggestion
- `POST /api/v1/products/:id/reject-suggestion` - Reject AI suggestion

**Frontend:**
- Review queue in seller dashboard
- Side-by-side comparison (current vs AI suggestion)
- Accept/reject buttons
- Clear indication of manually edited fields

---

## 🎯 FINAL GUARANTEE

These additions:
- ✅ Do NOT convert the app into a marketplace
- ✅ Do NOT break SWIFTLINE logic
- ✅ Do NOT require buyer accounts
- ✅ Do NOT affect payments or wallets
- ✅ Prepare the platform for scale, trust, and growth

---

## 📋 UPDATED IMPLEMENTATION CHECKLIST

### Phase 1: Database Schema (UPDATED)
- [x] Add Store model with visibility fields
- [x] Add Product model with availability & AI fields
- [x] Add StoreSyncLog model
- [x] Add FraudSignal model
- [x] Add Promotion model
- [x] Add productId to Transaction model (optional)
- [x] Add AI metadata fields to Product
- [x] Add sync failure tracking to Store
- [x] Add risk score fields to Store
- [x] Add all required enums (StoreStatus, StoreVisibility, SyncStatus, ProductStatus, ProductSource, PromotionType, DiscountType)
- [ ] Run Prisma migration (requires DATABASE_URL)
- [ ] Generate Prisma client

### Phase 2: Backend API - Store Management (UPDATED)
- [ ] Create store controller
- [ ] Create store routes
- [ ] Implement store CRUD operations
- [ ] Implement store visibility management
- [ ] Implement store status management
- [ ] Add payout method validation
- [ ] Add store meta endpoint (OpenGraph)
- [ ] Test store endpoints

### Phase 3: Backend API - Product Management (UPDATED)
- [ ] Create product controller
- [ ] Create product routes
- [ ] Implement product CRUD operations
- [ ] Implement product status management
- [ ] Implement availability management
- [ ] Implement AI suggestion system
- [ ] Implement source of truth rules
- [ ] Add product meta endpoint (OpenGraph)
- [ ] Link products to transactions
- [ ] Test product endpoints

### Phase 4: Social Page Connection (NO CHANGE)
- [ ] Research Instagram/Facebook API requirements
- [ ] Implement OAuth flow for Instagram
- [ ] Implement OAuth flow for Facebook
- [ ] Store connection tokens securely
- [ ] Create connection management endpoints
- [ ] Test social connections

### Phase 5: AI Integration (UPDATED)
- [ ] Set up AI service (OpenAI/Claude/etc.)
- [ ] Implement initial page scan
- [ ] Implement product extraction logic
- [ ] Calculate confidence scores
- [ ] Generate extraction warnings
- [ ] Track missing fields
- [ ] Create draft products from AI scan
- [ ] Implement AI governance
- [ ] Implement source of truth rules
- [ ] Log all AI actions
- [ ] Test AI scanning

### Phase 6: Auto-Sync Service (UPDATED)
- [ ] Create background job service
- [ ] Implement incremental sync logic
- [ ] Detect new posts
- [ ] Detect deleted posts
- [ ] Detect updated posts
- [ ] Implement failure tracking
- [ ] Implement auto-disable logic
- [ ] Create sync logs
- [ ] Implement seller notifications
- [ ] Test sync service

### Phase 7: Public Store Frontend (UPDATED)
- [ ] Create `/store/:slug` route
- [ ] Build PublicStorePage component
- [ ] Build ProductGrid component
- [ ] Create `/store/:slug/product/:productId` route
- [ ] Build ProductDetailPage component
- [ ] Add OpenGraph meta tags
- [ ] Generate dynamic OG images
- [ ] Integrate with existing payment flow
- [ ] Test public store pages

### Phase 8: Seller Dashboard Extensions (UPDATED)
- [ ] Add "Store" tab to seller dashboard
- [ ] Build store setup form
- [ ] Build store settings page
- [ ] Add visibility controls
- [ ] Add product management section
- [ ] Add product availability controls
- [ ] Add AI review queue
- [ ] Add AI suggestion UI
- [ ] Add social connection UI
- [ ] Add sync status display
- [ ] Add promotion management
- [ ] Test seller dashboard extensions

### Phase 9: Fee Transparency (NO CHANGE)
- [ ] Enhance transaction API to include fee breakdown
- [ ] Update seller transaction list to show fees
- [ ] Add fee breakdown component
- [ ] Test fee display

### Phase 10: Admin Extensions (UPDATED)
- [ ] Add stores section to admin dashboard
- [ ] Build store list view
- [ ] Add store management actions
- [ ] Add sync log viewer
- [ ] Add manual sync trigger
- [ ] Add fraud signal viewer
- [ ] Add risk score display
- [ ] Add promotion management (fee discounts)
- [ ] Test admin extensions

### Phase 11: Fraud & Risk System (NEW)
- [ ] Implement device fingerprinting
- [ ] Integrate IP reputation service
- [ ] Implement payment velocity tracking
- [ ] Calculate risk scores
- [ ] Create fraud signal logging
- [ ] Build admin fraud dashboard
- [ ] Test fraud system

### Phase 12: Promotion System (NEW)
- [ ] Implement promotion creation
- [ ] Implement promo code validation
- [ ] Integrate promotions with checkout
- [ ] Implement fee discounts (admin)
- [ ] Build promotion management UI
- [ ] Test promotion system

### Phase 13: Testing & Polish (UPDATED)
- [ ] End-to-end testing of store creation
- [ ] End-to-end testing of product creation
- [ ] End-to-end testing of social connection
- [ ] End-to-end testing of AI scan
- [ ] End-to-end testing of auto-sync
- [ ] End-to-end testing of sync failure handling
- [ ] End-to-end testing of AI suggestions
- [ ] End-to-end testing of source of truth rules
- [ ] End-to-end testing of public store purchase flow
- [ ] End-to-end testing of promotions
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation

---

## 📊 Progress Tracking (UPDATED)

**Current Status:** Planning Phase Complete - Ready for Implementation
**Started:** [Date to be filled]
**Target Completion:** [Date to be filled]

**Completed:**
- [x] Requirements analysis
- [x] Implementation plan documentation
- [x] Missing pieces identification
- [x] Safety & growth features added

**In Progress:**
- [ ] Database schema design
- [ ] Backend API development
- [ ] Frontend development

**Blocked:**
- [ ] None currently

**Remaining:**
- [ ] All implementation phases (see updated checklist above)

