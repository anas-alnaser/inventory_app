# Next.js Firebase App

A Next.js application connected to Firebase.

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

The Firebase configuration is set up in `lib/firebase.js`. The app is connected to:
- Project ID: `anas-9f395`
- Analytics is enabled

## Project Structure

```
.
├── app/              # Next.js app directory
│   ├── layout.tsx   # Root layout
│   ├── page.tsx     # Home page
│   └── globals.css  # Global styles
├── lib/
│   └── firebase.js  # Firebase configuration
├── package.json     # Dependencies
└── next.config.js   # Next.js configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)

