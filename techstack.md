# MixLink Technical Stack & Development Guidelines

## Core Technologies

### Frontend Framework
- **React 18+** with TypeScript
- **Vite** for development and building
- **React Router** for navigation

### Styling
- **Tailwind CSS** for styling
  - No additional UI libraries allowed
  - Custom components only

### Icons
- **Lucide React** exclusively for icons
  - No other icon libraries permitted
  - Use for logos and UI elements

### Images
- **Unsplash** for stock photos
  - Use direct URLs only
  - No local image storage
  - Example: `https://images.unsplash.com/photo-{ID}`

### Backend & Data
- **Supabase** for:
  - Authentication
  - Database
  - Real-time subscriptions
  - File storage
  - Edge Functions

### Audio Streaming
- **WebRTC** for peer-to-peer streaming
- **Socket.IO** for signaling

## Development Rules

### Package Management
1. Always use `package.json` for dependencies
2. No additional UI libraries without explicit approval
3. Prefer Node.js scripts over shell scripts

### Component Guidelines
1. Use functional components with hooks
2. Implement proper TypeScript types
3. Follow React best practices for hooks
4. Keep components focused and reusable

### Styling Rules
1. Use Tailwind classes exclusively
2. Follow mobile-first responsive design
3. Maintain consistent spacing and color schemes
4. Use CSS custom properties for theme values

### Icon Usage
1. Import icons from lucide-react:
   ```typescript
   import { IconName } from 'lucide-react';
   ```
2. Use consistent icon sizes
3. Apply appropriate aria-labels

### Image Guidelines
1. Always use Unsplash URLs
2. Include proper alt text
3. Implement lazy loading
4. Use appropriate image sizes

### State Management
1. Use React Context for global state
2. Implement custom hooks for reusable logic
3. Keep component state minimal
4. Use TypeScript for type safety

### Code Style
1. Use ESLint configuration
2. Follow TypeScript strict mode
3. Implement proper error handling
4. Add JSDoc comments for complex functions

### Performance
1. Implement code splitting
2. Use React.lazy for route-based splitting
3. Optimize images and assets
4. Monitor bundle size

## Environment Setup

### Required Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_publishable_key
```

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Best Practices

### Component Structure
```typescript
import { useState } from 'react';
import { Icon } from 'lucide-react';

interface Props {
  // Define prop types
}

export function ComponentName({ prop1, prop2 }: Props) {
  // Implementation
}
```

### Styling Example
```tsx
<div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
  <h2 className="text-xl font-semibold text-white">Title</h2>
</div>
```

### Icon Implementation
```tsx
<Button>
  <Icon className="w-5 h-5 text-current" />
  <span>Label</span>
</Button>
```

### Image Usage
```tsx
<img
  src="https://images.unsplash.com/photo-ID"
  alt="Descriptive text"
  className="w-full h-auto rounded-lg"
  loading="lazy"
/>
```

## Deployment

### Build Process
1. Ensure all environment variables are set
2. Run build command
3. Verify build output
4. Deploy to supported platforms only

### Supported Deployment Platforms
- Netlify (primary)
- Other platforms require approval

## Version Control

### Commit Guidelines
1. Use descriptive commit messages
2. Follow conventional commits
3. Keep changes focused
4. Include relevant tests

### Branch Strategy
1. Main branch for production
2. Feature branches for development
3. Pull requests for code review
4. Proper version tagging