# Expo & LoopDev Mobile Guidelines

## Versioned Docs
Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Mobile Design System & UI Consistency Rules (Mandatory)
All mobile screens in `apps/mobile/components/` MUST adhere strictly to the Rivera & LoopDev Mobile Design System:

1. **Tokens Single Source of Truth**:
   - Always import colors, radii, spacing, and typography from `../theme/tokens` (`mobileTheme`, `commonMobileStyles`).
   - DO NOT hardcode random brand colors, indigo/violet buttons, or ad-hoc custom card borders.
   - Primary Brand Color: `#135bec` (Soft background: `#eff6ff`).

2. **Standard Mobile UI Primitives**:
   - **Page Header**: Use `<MobilePageHeader eyebrow="..." title="..." subtitle="..." actionButton={{...}} />` for every screen header to guarantee uniform typography and alignment.
   - **Segmented Controls**: Use `<MobileSegmentedControl options={[...]} selected={...} onChange={...} />` for sub-view toggles (tabs, filter views, column switchers).
   - **Search & Filters**: Use `<MobileSearchBar value={...} onChangeText={...} />` with standard styling.
   - **Modals & Action Sheets**: Use `<MobileModalSheet visible={...} onClose={...} title="...">` for contextual actions and creation/detail overlays. Never create divergent standalone modal backdrops.

3. **Card Architecture**:
   - Use `commonMobileStyles.card` (`borderRadius: 17`, border `#e2e8f0`, soft shadow `boxShadow: 0px 2px 7px rgba(15,23,42,0.04)`).
   - Keep cards clean: use the 3-dots `MoreHorizontal` action trigger to open `MobileModalSheet` rather than piling large inline action buttons inside the card body.

4. **Zero Emojis Policy**:
   - Use exclusively `lucide-react-native` icons across all mobile screens.
