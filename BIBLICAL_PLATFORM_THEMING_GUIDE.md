# Biblical Research Platform - Complete UI Theming Guide

## Overview
This comprehensive guide catalogs every themeable UI element across all 60+ components in the Biblical Research Platform, enabling consistent theme creation for dark mode, premium palettes, and accessibility themes.

## Core Theming Architecture

### CSS Variable System (34 Variables)
All visual styling is controlled through CSS variables in `client/src/index.css`:

```css
:root {
  /* Core Colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  
  /* UI Element Colors */
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  
  /* Interactive Elements */
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  
  /* State Colors */
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  
  /* Borders & Outlines */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  
  /* Radius Values */
  --radius: 0.5rem;
}

.dark {
  /* Dark theme overrides for all variables */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... all other dark variants */
}
```

### Direct CSS Variable Usage
Some components use direct CSS variables for precise control:
- **Checkbox**: `--border-color`, `--accent-color`, `--bg-primary`, `--text-primary`
- **Glass Morphism**: Performance-optimized blur effects (4px desktop, 2px mobile)

## Complete Component Categorization

### 1. FOUNDATIONAL COMPONENTS

#### Typography & Text
- **Label** (`label.tsx`): Base text styling, font weights
- **Typography elements**: Headers, paragraphs, spans with semantic color tokens

#### Layout Containers
- **Card** (`card.tsx`): Background, borders, shadow
  - CardHeader, CardContent, CardFooter, CardTitle, CardDescription
- **Sheet** (`sheet.tsx`): Slide-out panels with overlay
- **Sidebar** (`sidebar.tsx`): Navigation panel with collapsible sections
- **Aspect Ratio** (`aspect-ratio.tsx`): Responsive container ratios

#### Separators & Dividers
- **Separator** (`separator.tsx`): Horizontal/vertical dividers with border colors

### 2. INTERACTIVE CONTROLS

#### Buttons (6 Variants)
- **Button** (`button.tsx`) with variants:
  - `default`: Primary button styling
  - `destructive`: Error/delete actions
  - `outline`: Secondary button with border
  - `secondary`: Muted background
  - `ghost`: Transparent background
  - `link`: Text-only button
- **Toggle** (`toggle.tsx`): On/off state with pressed styling
- **Toggle Group** (`toggle-group.tsx`): Multiple toggle buttons

#### Form Controls
- **Input** (`input.tsx`): Text fields with border/focus states
- **Textarea** (`textarea.tsx`): Multi-line text input
- **Checkbox** (`checkbox.tsx`): Custom styling with CSS variables
- **Radio Group** (`radio-group.tsx`): Single selection with indicators
- **Switch** (`switch.tsx`): Toggle switch with thumb animation
- **Slider** (`slider.tsx`): Range input with track/thumb styling
- **Input OTP** (`input-otp.tsx`): One-time password fields

#### Selection Components
- **Select** (`select.tsx`): Dropdown with trigger, content, items
- **Command** (`command.tsx`): Search/command palette with cmdk integration
- **Combobox** (within command): Autocomplete dropdown

### 3. NAVIGATION COMPONENTS

#### Menus & Dropdowns
- **Dropdown Menu** (`dropdown-menu.tsx`): Complete menu system
  - Items, Labels, Separators, Shortcuts, Checkboxes, Radio items
- **Context Menu** (`context-menu.tsx`): Right-click menus (identical styling to dropdown)
- **Menubar** (`menubar.tsx`): Horizontal menu bar with submenus
- **Navigation Menu** (`navigation-menu.tsx`): Main site navigation

#### Breadcrumbs & Links
- **Breadcrumb** (`breadcrumb.tsx`): Navigation trail with separators
- **Hover Card** (`hover-card.tsx`): Popover on hover with content

#### Tabs
- **Tabs** (`tabs.tsx`): Tab navigation with content panels
  - TabsList, TabsTrigger, TabsContent

### 4. FEEDBACK & DISPLAY

#### Notifications
- **Alert** (`alert.tsx`) with variants:
  - `default`: Standard informational
  - `destructive`: Error/warning alerts
- **Toast** (`toast.tsx`): Temporary notifications
- **Toaster** (`toaster.tsx`): Toast container/manager

#### Status Indicators
- **Badge** (`badge.tsx`) with variants:
  - `default`, `secondary`, `destructive`, `outline`
- **Progress** (`progress.tsx`): Progress bars with fill animation
- **Skeleton** (`skeleton.tsx`): Loading placeholders

#### Data Display
- **Table** (`table.tsx`): Complete table system
  - TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption
- **Avatar** (`avatar.tsx`): User profile images with fallbacks
- **Calendar** (`calendar.tsx`): Date picker with day states (selected, today, outside, disabled)

### 5. OVERLAY COMPONENTS

#### Dialogs & Modals
- **Dialog** (`dialog.tsx`): Modal dialogs with overlay
  - DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
- **Alert Dialog** (`alert-dialog.tsx`): Confirmation dialogs
  - Same structure as Dialog but for destructive actions
- **Drawer** (`drawer.tsx`): Mobile-friendly bottom sheet

#### Popovers
- **Popover** (`popover.tsx`): Floating content with trigger
- **Tooltip** (`tooltip.tsx`): Hover information with positioning

### 6. LAYOUT & INTERACTION

#### Scrolling & Resizing
- **Scroll Area** (`scroll-area.tsx`): Custom scrollbars with theme colors
- **Resizable** (`resizable.tsx`): Draggable panels with handles

#### Expandable Content
- **Accordion** (`accordion.tsx`): Collapsible sections
  - AccordionItem, AccordionTrigger, AccordionContent
- **Collapsible** (`collapsible.tsx`): Simple expand/collapse

#### Media & Carousels
- **Carousel** (`carousel.tsx`): Image/content slider with navigation
  - CarouselContent, CarouselItem, CarouselPrevious, CarouselNext
- **Chart** (`chart.tsx`): Data visualization components

### 7. SPECIALIZED COMPONENTS

#### Form Management
- **Form** (`form.tsx`): React Hook Form integration
  - FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage

#### Pagination
- **Pagination** (`pagination.tsx`): Page navigation with numbered controls

#### Theme Management
- **Theme Switcher** (`theme-switcher.tsx`): Light/dark theme toggle

### 8. BIBLICAL PLATFORM SPECIFIC

#### Custom Loaders
- **HolyBookLoader** (`HolyBookLoader.tsx`): Bible-themed loading animation
- **LoaderSelector** (`LoaderSelector.tsx`): Multiple loader options
- **BibleHairFan** (`BibleHairFan.tsx`): Decorative element
- **BiblePageFan** (`BiblePageFan.tsx`): Page transition effect

#### Transitions & Effects
- **BookPageTransition** (`BookPageTransition.tsx`): Page flip animations
- **RealisticBookTransition** (`RealisticBookTransition.tsx`): 3D book effects
- **PageTurnDemo** (`PageTurnDemo.tsx`): Demo transition
- **DynamicBackground** (`DynamicBackground.tsx`): Animated backgrounds
- **IntroOverlay** (`IntroOverlay.tsx`): Welcome screen

#### Utility Components
- **AdvancedSizeController** (`AdvancedSizeController.tsx`): Font/size controls
- **ManualSizeController** (`ManualSizeController.tsx`): Manual sizing
- **SizeSelector** (`SizeSelector.tsx`): Size picker
- **ScrollbarTooltip** (`ScrollbarTooltip.tsx`): Custom scrollbar feedback
- **PatchNotesBanner** & **PatchNotesModal**: Update notifications
- **connectivity-status** & **offline-indicator**: Network status

## Theme Implementation Strategy

### 1. Semantic Token System
All components use semantic color tokens:
- `primary` / `primary-foreground`
- `secondary` / `secondary-foreground`
- `destructive` / `destructive-foreground`
- `muted` / `muted-foreground`
- `accent` / `accent-foreground`
- `background` / `foreground`
- `border` / `ring`
- `popover` / `popover-foreground`
- `card` / `card-foreground`

### 2. Variant System
Components use `class-variance-authority` for consistent variant patterns:
```typescript
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "primary-styling",
        secondary: "secondary-styling",
        destructive: "error-styling",
        // etc.
      }
    }
  }
)
```

### 3. Dark Mode Implementation
- CSS variables automatically switch in `.dark` class
- All components inherit theme through semantic tokens
- No component-specific dark mode overrides needed

### 4. Accessibility Considerations
- High contrast ratios maintained across themes
- Focus indicators use `ring` color token
- Disabled states use opacity and muted colors
- Screen reader support maintained

### 5. Animation & Transitions
- Tailwind CSS animations: `animate-in`, `animate-out`, `fade-in`, `fade-out`
- Data attributes for state-based styling: `data-[state=open]`, `data-[disabled]`
- Glass morphism with performance optimization

## Creating New Themes

### Step 1: Define Color Palette
Create new CSS variable values for all 34 variables in the theme system.

### Step 2: Test Component Coverage
Verify all component variants render correctly:
- Buttons (6 variants)
- Alerts (2 variants) 
- Badges (4 variants)
- Form states (normal, error, disabled)
- Interactive states (hover, focus, active, disabled)

### Step 3: Accessibility Validation
- Contrast ratios meet WCAG guidelines
- Focus indicators are visible
- Color is not the only way to convey information

### Step 4: Biblical Platform Specific Testing
- Custom loaders maintain theme consistency
- Glass morphism effects work across themes
- Scrollbar styling adapts to theme
- Holy button animations respect theme colors

## Conclusion

This comprehensive categorization covers all 60+ UI components, ensuring no visual element is missed when creating or updating themes. The semantic token system provides consistent theming across all components, while the variant system allows for component-specific styling needs.

Every component listed here uses the CSS variable system or semantic Tailwind classes, making theme updates propagate automatically across the entire platform when the root CSS variables are modified.