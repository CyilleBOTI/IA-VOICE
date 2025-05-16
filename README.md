# Zandosh E-Commerce Platform

A modern e-commerce platform built with Next.js, shadcn/ui, and Firebase.

## Features

- Responsive and modern UI using shadcn/ui components
- User authentication with Firebase Auth
- Product browsing and searching
- Shopping cart functionality
- Checkout process
- User profiles and order history
- Dark mode support

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **State Management**: React Context API
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd zandosh
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

4. Run the seed script to populate initial data:

```bash
npm run setup
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
zandosh/
├── src/
│   ├── app/                # Next.js app directory
│   │   ├── auth/           # Authentication pages
│   │   ├── home/           # Home page
│   │   ├── profile/        # User profile page
│   │   ├── items/          # Product listings and details
│   │   ├── cart/           # Shopping cart and checkout
│   │   └── api/            # API routes
│   ├── components/         # Reusable components
│   │   ├── ui/             # UI components from shadcn
│   │   └── ...             # Other components
│   ├── lib/                # Utility functions and Firebase config
│   └── setup/              # Setup scripts for initial data
└── ...
```

## Default Users

The setup script creates two default users:

- **Admin User**:
  - Email: admin@example.com
  - Password: Admin@123
  - Role: root

- **Client User**:
  - Email: client@example.com
  - Password: Client@123
  - Role: client

## Troubleshooting

### Products Not Showing Up

If products are not displaying in the application:

1. Make sure you've run the seed script to populate your database:
   ```bash
   npm run setup
   ```

2. Check that your Firebase credentials are correct in `.env`

3. Verify that your Firebase security rules allow reading from the collections

4. Check the browser console for any errors

5. Ensure that your Firestore database has the following collections:
   - `items` - For product data
   - `categories` - For category data
   - `roles` - For user roles
   - `userRoles` - For user-role assignments
   - `users` - For user data
   - `checkouts` - For cart and checkout data

## License

This project is licensed under the MIT License.
"# IA-VOICE"  
