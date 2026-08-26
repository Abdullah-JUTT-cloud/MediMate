# Preview Instructions

## Quick Start

To preview the redesigned Consultation Workspace without navigating through the full application:

### Option 1: Use the Preview Component

1. Import the preview component in your app:

```jsx
import ConsultationWorkspacePreview from "./pages/ConsultationWorkspacePreview";

function App() {
  return (
    <div>
      <ConsultationWorkspacePreview />
    </div>
  );
}
```

2. This will render a button that opens the redesigned workspace with demo data.

### Option 2: Test Through Doctor Queue

1. Navigate to the Doctor Queue page
2. Click "Start Consultation" on any patient
3. The redesigned workspace will open as a slide-in drawer

## Demo Data Included

The preview component includes:

- **Patient**: Muhammad Abdullah (21 Yrs, Male, AB+ blood group)
- **Appointment**: Walk-In, Slot 10:00, Paid Rs. 3,000
- **History**: 2 prior visits with diagnoses, medicines, and lab tests

## What to Look For

### Visual Design
✅ Light/slate color palette (white surface, #f8fafc background)
✅ Clean white cards with soft shadows (shadow-sm)
✅ Subtle gray borders (border-slate-200)
✅ Teal accent colors (#0d9488, #10b981)
✅ No harsh neon/cyan outlines

### Layout
✅ Sticky top patient bar with avatar, name, status, and metadata
✅ Left panel (35%): Patient History with accordion cards
✅ Right panel (65%): Active Examination & Prescription Form
✅ Sticky action footer with patient name, total, and action buttons

### Interactive Elements
✅ Quick suggestion chips for diseases (e.g., + Hypertension)
✅ Frequency selector buttons (1-0-1, 1-1-1, etc.)
✅ Duration selector buttons (3 Days, 5 Days, etc.)
✅ Quick follow-up date buttons (+3 Days, +1 Week, etc.)
✅ Accordion cards for patient history
✅ Medicine row add/remove functionality

### Conditional Rendering
✅ Empty sections (like "none" notes) are hidden
✅ Only relevant data is displayed

## Testing Checklist

- [ ] Does the workspace open correctly?
- [ ] Is the color scheme light and professional?
- [ ] Are all interactive elements clickable?
- [ ] Do the quick-chips add items to the input fields?
- [ ] Do the preset buttons (frequency, duration) work?
- [ ] Can you add/remove medicine rows?
- [ ] Does the accordion expand/collapse?
- [ ] Are empty sections hidden?
- [ ] Does the form validation work?
- [ ] Does the save button show loading state?

## Expected Behavior

1. **Opening**: Workspace slides in from the right (or opens as modal)
2. **Patient Bar**: Shows patient avatar, name, status pill, metadata
3. **Left Panel**: Shows patient history cards, collapsed by default
4. **Right Panel**: Shows form with all modules (Complaints, Vitals, Prescription, Lab)
5. **Footer**: Shows patient name, net total, Cancel and Save buttons
6. **Closing**: Click X button or press Esc to close

## Troubleshooting

If the workspace doesn't open:
1. Check that all imports are correct
2. Verify the component is exported properly
3. Check browser console for errors
4. Ensure Tailwind CSS is properly configured

If styling looks wrong:
1. Check that the light theme is active (not dark mode)
2. Verify Tailwind classes are being applied
3. Check for CSS conflicts with other styles
