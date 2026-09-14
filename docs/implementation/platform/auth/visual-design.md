# Platform Auth & Multi-tenant Context Visual Design Specification

## Document Control

| Field | Value |
|---|---|
| Module | Auth & Tenant Context |
| Product definition | `docs/implementation/platform/auth/HANDOFF.md` |
| Run ID | `MOD-AUTH-20260914-001` |
| Phase | `01-visual-design` |
| Visual Design Spec | `docs/implementation/platform/auth/visual-design.md` |
| Status | `completed` |

---

## 1. Executive Summary & Design Adaptation Strategy

This visual design specification defines the user interface surfaces and component styling for **Platform Auth & Tenant Context**, aligning both **Desktop Web** and **Mobile App** (iOS / Android / Web) with the editorial design language established in the **Rivera template**:

1. **Desktop Web Re-use & Adaptation**:
   - Adapts Rivera's editorial split-screen login layout (`src/template/rivera/pages/auth/AuthLayout.tsx`), featuring dark luxury editorial styling, deep blue gradients (`#0e1726` to `#121b2d`), subtle dot mesh patterns, and brand typography.
   - Reuses Rivera's password recovery (`ForgotPassword.tsx`, `ResetPassword.tsx`) with dev-mode notices for missing SMTP.
   - **Account Dropdown Organization Selector**: Integrated directly inside the Topbar's user account menu (`src/components/layout/Topbar.tsx`), keeping tenant switching anchored to the active account identity.
   - Logout includes an explicit confirmation modal guaranteeing zero cross-tenant memory leakage.

2. **Mobile App Harmony**:
   - Replaces generic mobile login screens with Rivera-themed mobile views.
   - Adapts `MobileAccountSheet.tsx` to host the organization selector natively as a switchable bottom sheet card list, styled with high contrast, haptic touch targets (min 48px), and Rivera dark theme cues.

---

## 2. Visual Design Artifacts (SVG Wireframes)

All visual design artifacts have been generated in full vector SVG format under `docs/implementation/platform/auth/wireframes/`:

| Screen / Flow | Platform | SVG Wireframe Path | Key UX Patterns |
|---|---|---|---|
| **Login & Identity** | Desktop Web | `docs/implementation/platform/auth/wireframes/desktop-login.svg` | Split-screen, Rivera editorial aside, subtle dot grid, typed credential fields, enterprise SSO trigger |
| **Password Recovery** | Desktop Web | `docs/implementation/platform/auth/wireframes/desktop-forgot-password.svg` | Verified email submission, Inbucket/local dev feedback banner, instant reset guidance |
| **Password Recovery** | Mobile (iOS/Android) | `docs/implementation/platform/auth/wireframes/mobile-forgot-password.svg` | Dedicated mobile recovery screen, dev notice, email input, clean return flow |
| **Account Org Selector** | Desktop Web | `docs/implementation/platform/auth/wireframes/desktop-account-org-selector.svg` | Embedded inside Topbar Account Dropdown, Super Admin badge, active organization badge, list of memberships & global access |
| **Logout Confirmation** | Desktop Web | `docs/implementation/platform/auth/wireframes/desktop-logout-confirmation.svg` | Modal backdrop, warning badge, cache purge announcement, explicit confirmation |
| **Mobile Login** | Mobile (iOS/Android) | `docs/implementation/platform/auth/wireframes/mobile-login.svg` | 390x844 layout, Rivera gradient & glow, FaceID / Biometric toggle, 48px+ touch targets |
| **Mobile Account Sheet** | Mobile (iOS/Android) | `docs/implementation/platform/auth/wireframes/mobile-account-sheet.svg` | Native bottom sheet, drag handle, organization switch list, quick profile links, red sign out CTA |

---

## 3. Detailed Component & Surface Specifications

### 3.1. Desktop Login & Authentication (`desktop-login.svg`)
- **Container**: 2-column grid (`lg:grid-cols-2`, min-h-screen).
- **Left Aside (Marketing/Editorial)**:
  - Background: Linear gradient (`#0e1726` to `#0a0f1d`) with `radial-gradient(hsl(var(--accent)/0.4)_1px,transparent_1px)` mesh.
  - Headline: 42px bold font-display ("The admin workspace your team will actually enjoy using").
  - Footer: "LOOPDEV PLATFORM · 2026 EDITION".
- **Right Main (Form)**:
  - Background: Deep dark background (`#0b0f19` / `#090d16`).
  - Inputs: Floating/bordered input components with left Lucide icons (`Mail`, `Lock`), password show/hide toggle (`Eye`/`EyeOff`), and Zod validation feedback.
  - CTA Button: Rivera primary brand button (`#2563eb`), 46px height with micro-animations.

### 3.2. Password Recovery Flow (`desktop-forgot-password.svg`)
- **Route**: `/pages/forgot-password` and `/pages/reset-password`.
- **Layout**: Follows `AuthLayout` split screen.
- **Developer Banner**: In local development, shows an informational alert informing the developer that reset links are routed to Inbucket (`http://localhost:54324/`) or can be generated via `supabase auth admin reset-password-for-email`.

### 3.3. Account Menu Organization Selector (`desktop-account-org-selector.svg`)
- **Placement**: Nested inside the Rivera Topbar user dropdown (`Topbar.tsx`), opened by clicking the user avatar/name in the top-right corner.
- **Section Hierarchy**:
  1. **User Identity Header**: Name, email, role badge (`SUPER ADMIN / PLATFORM OWNER` or `TENANT MEMBER`).
  2. **Active Organization Selector**:
     - Current organization highlighted with primary border, brand icon, and active checkmark.
     - Selectable organization cards for other joined organizations.
     - For Super Admins (`is_super_admin: true` or role `owner`): expanded view offering full directory of platform tenants.
  3. **Standard Rivera Account Links**: Profile, Account Settings, Security & 2FA, Billing.
  4. **Sign Out**: Red accent action triggering atomic tenant cleanup.

### 3.4. Mobile App Experience (`mobile-login.svg`, `mobile-forgot-password.svg` & `mobile-account-sheet.svg`)
- **Theme & Color Palette (Light Shell)**:
  - Mobile runs in **Light Mode** as implemented across `MobileAppShell.tsx` (`#f8fafc`), `MobileBottomSheet.tsx` (`#ffffff`), and `MobileBottomNav.tsx` (`#ffffff`).
  - Rivera primary blue brand accent (`#135bec`) for focused states, submit CTAs, and active navigation badges.
  - Neutral borders (`#e5e7eb`, `#cbd5e1`) and clean slate typography (`#111827`, `#64748b`).
  - Destructive red (`#ef334e`) for sign out and cache flush.
- **Mobile Account Sheet**:
  - Displayed upon tapping the avatar or "More" bottom navigation item.
  - Houses the Organization Switcher directly above account preferences.
  - Selection of a new organization immediately dismisses the sheet, flushes React Query caches, resets tenant headers, and navigates to the organization's launchpad.

---

## 4. Design Verification Matrix

| Requirement | Visual Design Artifact | Status |
|---|---|---|
| REQ-AUTH-PORT | `desktop-login.svg`, `mobile-login.svg` | Verified |
| REQ-AUTH-TENANT-CONTEXT | `desktop-account-org-selector.svg`, `mobile-account-sheet.svg` | Verified |
| REQ-AUTH-SUPABASE-ADAPTER | `desktop-login.svg`, `desktop-forgot-password.svg` | Verified |
| REQ-AUTH-MOBILE-STORAGE | `mobile-login.svg` (Biometrics / Secure Storage boundary) | Verified |
| REQ-AUTH-ISOLATION-CLEANUP | `desktop-logout-confirmation.svg` (Zero-leakage purge prompt) | Verified |

