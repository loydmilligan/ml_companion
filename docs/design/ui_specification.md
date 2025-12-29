# UI Specification: Music League Family Companion App

## 1. Welcome & Authentication Screen (Family Lead Entry)
**Purpose:** This screen serves as the initial entry point for the Family Lead to either log in to an existing account or create a new one. It prioritizes clarity and a streamlined experience to facilitate quick access or account setup, establishing the user's role as a Family Lead from the start.

### Key Elements & Interaction:

#### Header:
* **App Logo & Name:** Centered at the top of the screen (e.g., "Harmony Hub" with a stylized music note or family icon).
* **Contextual Tagline:** "Your family's league, connected." (Small, beneath the app name).

#### Authentication Tabs/Toggle:
* A prominent, horizontally aligned tab selector with "Login" and "Sign Up" options. Tapping a tab should smoothly transition the form fields below without a full page reload or interrupting elements. "Login" is active by default.
* **Visuals:** Tabs will have distinct background colors or an active indicator (e.g., an underline, highlight) to show the selected state.

#### Form Area (Dynamic based on selected tab):
* **Email Input Field:** Label "Email Address". Standard text input.
* **Password Input Field:** Label "Password" (Login) / "Create Password" (Sign Up). Password type input with a visible/hide toggle icon. For "Sign Up", a real-time password strength indicator (e.g., "Weak," "Good," "Strong") will appear below the field.
* **Confirm Password Input Field (Sign Up only):** Label "Confirm Password". Password type input, only visible when "Sign Up" tab is active.
* **"Forgot Password?" Link (Login only):** Small text link, right-aligned below the password field. Tapping this navigates to a dedicated password reset screen.
* **Primary Call to Action Button:** "Log In" (Login) / "Create Account" (Sign Up). Full-width button below the form fields.

#### Social Login Section:
* **Separator:** Horizontal line with text "Or continue with".
* **Social Login Buttons:** Prominent buttons for "Continue with Google" and "Continue with Apple ID". These will use the respective service's official branding (icons, limited color integration) but align with the app's button style for consistency.

### Visual Communication:
* **Layout:** Clean, minimalist, centered layout with ample whitespace to reduce cognitive load. The form fields and buttons should be easily thumb-reachable on mobile devices.
* **Typography:** A modern, legible sans-serif font family. Headings and primary call-to-actions use a bolder weight, while input labels and descriptive text use lighter weights for hierarchy.
* **Colors:** A neutral background (e.g., a very light off-white or soft gray). Input fields have a subtle light border. Primary action buttons leverage the app's main accent color. Social login buttons integrate their brand colors while maintaining overall design harmony.
* **Borders & Shadows:** Input fields and buttons will feature subtly rounded corners (e.g., 8px radius). Input fields gain a light border and a minimal inner shadow on focus. Buttons will exhibit a slight elevation effect (subtle drop shadow) on hover and a gentle press animation.
* **Animations:** Smooth, quick fade or horizontal slide animation when switching between the "Login" and "Sign Up" tabs (e.g., 200ms duration, ease-in-out). Button presses have a quick, satisfying scale-down and opacity change.

### User Flow:
1.  User opens the app, lands on this "Welcome & Authentication" screen. "Login" is the default active tab.
2.  **Login Path:** User enters credentials, taps "Log In".
    * If successful, user is authenticated and seamlessly navigated to the "Create Your Family Group" screen.
    * If unsuccessful, inline error messages appear below relevant fields (e.g., "Invalid email or password").
3.  **Sign Up Path:** User taps the "Sign Up" tab.
    * User enters email, password, and confirms password. Password strength indicator provides real-time feedback.
    * Taps "Create Account".
    * If successful, account is created, user is logged in, and seamlessly navigated to the "Create Your Family Group" screen.
    * If unsuccessful (e.g., email already exists, passwords don't match, weak password), inline error messages provide clear guidance.
4.  **Social Login Path:** User taps "Continue with Google" or "Continue with Apple ID".
    * Standard OAuth flow is initiated.
    * Upon successful authentication, user is logged in and navigated to the "Create Your Family Group" screen.

*Question:* To establish a cohesive visual identity from the outset, what is the desired primary brand color palette (e.g., 2-3 main colors plus neutrals) and what overall aesthetic (e.g., vibrant & playful, calm & sophisticated, modern & minimalist) should this Welcome & Authentication screen convey to reflect the 'Music League Family Companion' app's tone?
