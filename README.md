# Next.js Firebase App - Restaurant Management System

A Next.js application connected to Firebase with a comprehensive restaurant management system based on the ERD schema.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Firebase Configuration

The Firebase configuration is set up in `lib/firebase.ts`. The app is connected to:
- Project ID: `anas-9f395`
- Analytics is enabled
- Firestore database configured
- Storage configured
- Authentication configured

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── lib/
│   ├── firebase.ts         # Firebase configuration (App, Auth, Firestore, Storage, Analytics)
│   ├── firestore.ts        # Firestore collection references
│   └── firestore-helpers.ts # Helper functions for Firestore operations
├── types/
│   └── entities.ts         # TypeScript types for all entities based on ERD
├── firestore.rules         # Firestore security rules
├── storage.rules           # Firebase Storage security rules
├── package.json            # Dependencies
└── next.config.js          # Next.js configuration
```

## Database Schema

The application uses Firestore with the following main collections:

### Core Entities
- `branches` - Restaurant branches/locations
- `users` - System users with roles (admin, manager, cashier, staff)
- `suppliers` - Ingredient suppliers
- `ingredients` - Raw ingredients
- `menu_items` - Menu items/dishes

### Inventory & Purchasing
- `purchase_orders` - Purchase orders from suppliers
- `purchase_order_items` - Items in purchase orders
- `ingredient_stock` - Current stock levels per branch
- `stock_logs` - Stock change logs
- `menu_item_ingredients` - Ingredients used in menu items

### POS & Payments
- `pos_orders` - Point of sale orders
- `pos_order_items` - Items in POS orders
- `payments` - Payment transactions

### Analytics & AI
- `forecasts` - AI-generated ingredient forecasts
- `waste_predictions` - Waste prediction models
- `anomalies` - Detected anomalies
- `vision_snapshots` - Image-based inventory monitoring
- `analytics_cache` - Cached analytics data
- `system_logs` - System event logs

## Security Rules

### Firestore Rules (`firestore.rules`)
- Role-based access control (admin, manager, cashier, staff)
- Branch-based data isolation
- Users can only access data from their assigned branch
- Admins and managers have elevated permissions

### Storage Rules (`storage.rules`)
- Organized by branch for vision snapshots
- File size limits (images: 5-10MB, reports: 50MB)
- Content type validation
- Branch-based access control

## Deploying Firebase Rules

To deploy the security rules to Firebase:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage
```

## Usage Examples

### Creating a Document
```typescript
import { createDocument } from '@/lib/firestore-helpers';
import { branchesCollection } from '@/lib/firestore';

const branchId = await createDocument(branchesCollection, {
  name: 'Downtown Branch',
  address: '123 Main St',
});
```

### Querying Documents
```typescript
import { getPOSOrdersByBranch } from '@/lib/firestore-helpers';

const orders = await getPOSOrdersByBranch('branch-id-123', 50);
```

### Updating Stock
```typescript
import { updateIngredientStock } from '@/lib/firestore-helpers';

await updateIngredientStock('stock-id', 100, new Date('2024-12-31'));
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage Rules](https://firebase.google.com/docs/storage/security)

