# 设置页分组优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure settings page from a single-column flat layout into a sidebar-navigation layout with responsive mobile tabs

**Architecture:** Split SettingsPage into sectioned components, add active-section state with responsive sidebar/tab navigation, add AnimatePresence for content transitions

**Tech Stack:** React, TypeScript, Tailwind CSS, Framer Motion, lucide-react, shadcn/ui Button/Card/Label/Select/Slider

## Global Constraints

- No Zustand store changes — use local `useState<number>` for active section index
- No API layer changes — settings mutation stays on `configStore.updateConfig`
- All existing settings controls must work identically (theme, compression, watermark, CDN, raw, clear config, sign out)
- Dark mode must be correct in all new UI elements
- Mobile: top horizontal scroll tabs; Desktop (>=md): left fixed sidebar
- AccountSection is a placeholder only — no new features

---

## File Structure

```
src/app/settings/page.tsx          — MODIFY (complete restructure: sidebar + content + sections)
src/components/animations/PageAnimations.tsx  — READ ONLY (CardAnimation, PageTransition)
src/stores/configStore.ts          — READ ONLY (no changes)
src/hooks/useTheme.ts              — READ ONLY (no changes)
```

### Existing components to reuse

- `CardAnimation`, `PageTransition` — `@/components/animations/PageAnimations`
- `Button`, `Card`, `Label`, `Slider`, `Select` — `@/components/ui/*`
- `toast` — `sonner`
- `motion`, `AnimatePresence` — `framer-motion`

### Section mapping

| Section key | Current content in page.tsx |
|------------|---------------------------|
| appearance | Lines 128–168 (theme mode buttons) |
| image | Lines 177–265 (compression + watermark) |
| network | Lines 267–353 (CDN + raw link toggle) |
| danger | Lines 356–405 (clear config + sign out) |
| about | Lines 407–444 (version/desc/tech) |
| account | *(new placeholder)* |

---

### Task 1: Refactor settings page to sidebar layout

**Files:**
- Modify: `src/app/settings/page.tsx`

**Interfaces:**
- Consumes: `configStore` (zodand store), `useThemeStore`, `useSession`, `signOut`, `useRouter`
- Produces: No new exports; single-file refactor

**Render structure (desktop):**
```tsx
<div className="flex gap-6">
  {/* Left sidebar */}
  <aside className="w-56 flex-shrink-0 space-y-1">
    {sections.map((s, i) => (
      <button onClick={() => setActiveSection(i)}
        className={activeSection === i ? 'bg-primary/10 text-primary' : ''}>
        <s.icon /> {s.label}
      </button>
    ))}
  </aside>
  {/* Right content */}
  <main className="flex-1 min-w-0">
    <AnimatePresence mode="wait">
      <motion.div key={activeSection} ...>
        {activeSection === 0 && <AppearanceSection />}
        {activeSection === 1 && <ImageProcessingSection />}
        ...
      </motion.div>
    </AnimatePresence>
  </main>
</div>
```

**Render structure (mobile <768px):**
```tsx
{/* Top horizontal scroll tabs */}
<div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:hidden">
  {sections.map((s, i) => (
    <button onClick={() => setActiveSection(i)}>
      <s.icon /> {s.label}
    </button>
  ))}
</div>
{/* Content — same AnimatePresence structure */}
```

**Animation for content switch:**
```tsx
<motion.div
  key={activeSection}
  initial={{ opacity: 0, x: 10 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -10 }}
  transition={{ duration: 0.15 }}
>
  {/* section content */}
</motion.div>
```

- [ ] **Step 1: Define sections array and active state**

Add near the top of the component body, after all hooks:

```tsx
const sections = [
  { id: 'appearance', label: '外观', icon: Sun },
  { id: 'image',      label: '图片处理', icon: Image },
  { id: 'network',    label: '网络', icon: Globe },
  { id: 'danger',     label: '危险操作', icon: ShieldAlert },
  { id: 'account',    label: '账户', icon: User },
  { id: 'about',      label: '关于', icon: Info },
] as const

const [activeSection, setActiveSection] = useState(0)
```

Add `ShieldAlert` and `User` and `Info` to the lucide-react import line.

- [ ] **Step 2: Replace the flat `<div className="space-y-6">` with sidebar + content layout**

Replace lines 127–445 (the entire `div.space-y-6` block) with:

```tsx
<div className="flex gap-6">
  {/* Desktop sidebar */}
  <aside className="hidden md:block w-56 flex-shrink-0">
    <div className="sticky top-24 space-y-1">
      {sections.map((section, index) => {
        const Icon = section.icon
        return (
          <motion.button
            key={section.id}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection(index)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
              activeSection === index
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <Icon className="h-4 w-4" />
            {section.label}
          </motion.button>
        )
      })}
    </div>
  </aside>

  {/* Main content */}
  <main className="flex-1 min-w-0">
    <AnimatePresence mode="wait">
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.15 }}
      >
        {/* Mobile top tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:hidden mb-4 scrollbar-hide">
          {sections.map((section, index) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(index)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  activeSection === index
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
                )}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            )
          })}
        </div>

        {activeSection === 0 && <AppearanceSection />}
        {activeSection === 1 && <ImageProcessingSection />}
        {activeSection === 2 && <NetworkSection />}
        {activeSection === 3 && <DangerSection />}
        {activeSection === 4 && <AccountSection />}
        {activeSection === 5 && <AboutSection />}
      </motion.div>
    </AnimatePresence>
  </main>
</div>
```

- [ ] **Step 3: Extract AppearanceSection**

Replace lines 128–168 with the `AppearanceSection` component (inline const):

```tsx
const AppearanceSection = () => (
  <CardAnimation delay={0} className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
      <Sun className="h-5 w-5 text-primary" />
      <h2 className="text-xl font-semibold">主题模式</h2>
    </div>
    <div className="grid grid-cols-3 gap-3">
      {[
        { value: 'light', icon: Sun, label: '浅色' },
        { value: 'dark',  icon: Moon, label: '深色' },
        { value: 'system', icon: Monitor, label: '跟随系统' },
      ].map((option) => {
        const Icon = option.icon
        const isSelected = theme === option.value
        return (
          <motion.div key={option.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => handleThemeChange(option.value as 'light' | 'dark' | 'system')}
              className={cn(
                'w-full h-auto py-4 flex flex-col items-center gap-2 rounded-xl transition-all',
                isSelected && 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-800'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{option.label}</span>
            </Button>
          </motion.div>
        )
      })}
    </div>
  </CardAnimation>
)
```

- [ ] **Step 4: Extract ImageProcessingSection (compression + watermark)**

Replace lines 177–265 with inline `const ImageProcessingSection` component containing the compression settings block and watermark settings block exactly as they appear now, wrapped in a single CardAnimation.

- [ ] **Step 5: Extract NetworkSection (CDN + raw)**

Replace lines 267–353 with inline `const NetworkSection` component containing CDN select and raw link toggle exactly as they appear now.

- [ ] **Step 6: Extract DangerSection (clear config + sign out)**

Replace lines 356–405 with inline `const DangerSection` component containing clear-config and sign-out rows exactly as they appear now, wrapped in CardAnimation with red border colors preserved.

- [ ] **Step 7: Extract AboutSection**

Replace lines 407–444 with inline `const AboutSection` component with the three info rows (version, description, tech stack).

- [ ] **Step 8: Add AccountSection placeholder**

Add inline `const AccountSection`:

```tsx
const AccountSection = () => (
  <CardAnimation delay={0} className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
      <User className="h-5 w-5 text-primary" />
      <h2 className="text-xl font-semibold">账户</h2>
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400">更多账户设置即将推出。</p>
  </CardAnimation>
)
```

- [ ] **Step 9: Verify build and check for lint errors**

Run:
```bash
npx tsc --noEmit && npx eslint src/app/settings/page.tsx
```

Expected: type check passes, 0 new lint issues introduced.

- [ ] **Step 10: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "refactor(settings): sidebar navigation layout with responsive tabs"
```

---

## Spec Self-Review

### 1. Spec Coverage

| Spec 要求 | 对应 Step |
|----------|-----------|
| 桌面端左侧固定导航 | Step 2 |
| 移动端顶部水平 Tab | Step 2 |
| 6 个分类（外观/图片/网络/危险/账户/关于） | Steps 1, 3–8 |
| 点击切换 + 动画过渡 | Step 2 (AnimatePresence + motion.div) |
| 激活高亮 | Step 2 |
| 原有控件功能不变 | Steps 3–7 (提取内容不变) |
| 深色模式 | Step 2 (dark: classes on all nav items) |
| AccountSection 占位 | Step 8 |

No gaps.

### 2. Placeholder Scan

No "TBD" or "TODO". All section bodies are verbatim copies of existing JSX.

### 3. Type Consistency

- `sections` array typed `as const` → `section.id` is a literal type
- `activeSection: number` → matches array index
- `Sun/Moon/Monitor/Image/Globe/ShieldAlert/User/Info` — all from `lucide-react` (added to import)
- `handleThemeChange` — unchanged signature
- No new props, no new exports

All consistent.
