# Modern UI Components

This directory contains reusable animated components built with Framer Motion for the SVR Cashew Management System.

## Components

### AnimatedCard
A card component with fade-in and hover animations.

```jsx
import { AnimatedCard } from '@/components/ui';

<AnimatedCard delay={0.2} elevated>
  <h3>Card Title</h3>
  <p>Card content...</p>
</AnimatedCard>
```

**Props:**
- `delay` - Animation delay in seconds
- `elevated` - Enable hover lift effect
- `className` - Additional CSS classes
- `onClick` - Click handler

### AnimatedButton
An interactive button with scale and tap animations.

```jsx
import { AnimatedButton } from '@/components/ui';

<AnimatedButton
  variant="primary"
  isLoading={loading}
  onClick={handleClick}
>
  Click Me
</AnimatedButton>
```

**Variants:** `primary`, `secondary`, `success`, `danger`, `warning`, `outline`

### FadeIn
Wrapper component for fade-in animations.

```jsx
import { FadeIn } from '@/components/ui';

<FadeIn direction="up" delay={0.3}>
  <div>Content fades in from below</div>
</FadeIn>
```

**Directions:** `up`, `down`, `left`, `right`

### StaggerChildren
Animate multiple children with stagger effect.

```jsx
import { StaggerChildren, StaggerItem } from '@/components/ui';

<StaggerChildren staggerDelay={0.1}>
  {items.map(item => (
    <StaggerItem key={item.id}>
      <div>{item.content}</div>
    </StaggerItem>
  ))}
</StaggerChildren>
```

### Modal
Animated modal dialog.

```jsx
import { Modal } from '@/components/ui';

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Modal Title"
  size="md"
>
  <p>Modal content...</p>
</Modal>
```

**Sizes:** `sm`, `md`, `lg`, `xl`, `full`

### LoadingSpinner
Loading indicators.

```jsx
import { LoadingSpinner, LoadingDots } from '@/components/ui';

<LoadingSpinner size="md" />
<LoadingDots />
```

**Sizes:** `sm`, `md`, `lg`, `xl`

## Responsive Design

All components are responsive by default using Tailwind's breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## Custom Animations

Use Tailwind's animation classes:
- `animate-fade-in` - Fade in
- `animate-fade-in-up` - Fade in from below
- `animate-slide-in-left` - Slide in from left
- `animate-scale-in` - Scale up
- `animate-pulse-slow` - Slow pulse

## Color Palette

### Primary Colors (Blue)
- `primary-50` to `primary-900`

### Secondary Colors (Purple)
- `secondary-50` to `secondary-900`

### Accent Colors (Amber)
- `accent-50` to `accent-900`

## Shadows

- `shadow-soft` - Subtle shadow
- `shadow-medium` - Medium shadow
- `shadow-strong` - Strong shadow
- `shadow-glow` - Glowing effect
- `shadow-glow-lg` - Large glow

## Best Practices

1. Always use responsive classes (`md:`, `lg:`, etc.)
2. Prefer animated components over plain HTML
3. Keep animations subtle and performant
4. Use stagger animations for lists
5. Add loading states to buttons
6. Use appropriate delays for sequential animations
