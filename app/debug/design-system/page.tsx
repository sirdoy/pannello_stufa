'use client';

import Card, { CardHeader, CardTitle, CardContent, CardFooter, CardDivider } from '@/app/components/ui/Card';
import Button, { ButtonIcon, ButtonGroup } from '@/app/components/ui/Button';
import Banner from '@/app/components/ui/Banner';
import StatusBadge from '@/app/components/ui/StatusBadge';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import Input from '@/app/components/ui/Input';
import Select from '@/app/components/ui/Select';
import Toggle from '@/app/components/ui/Toggle';
import Checkbox from '@/app/components/ui/Checkbox';
import Toast from '@/app/components/ui/Toast';
import Modal from '@/app/components/ui/Modal';
import Skeleton from '@/app/components/ui/Skeleton';
import Divider from '@/app/components/ui/Divider';
import ProgressBar from '@/app/components/ui/ProgressBar';
import EmptyState from '@/app/components/ui/EmptyState';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import ConfirmationDialog from '@/app/components/ui/ConfirmationDialog';
import FormModal from '@/app/components/ui/FormModal';
import BottomSheet from '@/app/components/ui/BottomSheet';
import Badge from '@/app/components/ui/Badge';
import ConnectionStatus from '@/app/components/ui/ConnectionStatus';
import HealthIndicator from '@/app/components/ui/HealthIndicator';
import SmartHomeCard from '@/app/components/ui/SmartHomeCard';
import StatusCard from '@/app/components/ui/StatusCard';
import ControlButton from '@/app/components/ui/ControlButton';
import PageLayout from '@/app/components/ui/PageLayout';
import Section from '@/app/components/ui/Section';
import Grid from '@/app/components/ui/Grid';
import Tooltip from '@/app/components/ui/Tooltip';
import Spinner from '@/app/components/ui/Spinner';
import Accordion from '@/app/components/ui/Accordion';
import Sheet from '@/app/components/ui/Sheet';
import CommandPalette from '@/app/components/ui/CommandPalette';
import Kbd from '@/app/components/ui/Kbd';
import DataTable from '@/app/components/ui/DataTable';
import { WeatherIcon, getWeatherLabel } from '@/app/components/weather/WeatherIcon';
import { useState, useMemo } from 'react';
import { z } from 'zod';
import { Controller } from 'react-hook-form';
import { Home, Settings, Power, Moon } from 'lucide-react';
import CodeBlock from './components/CodeBlock';
import PropTable from './components/PropTable';
import AccessibilitySection from './components/AccessibilitySection';
import { componentDocs } from './data/component-docs';

/**
 * Local component interfaces for strict-mode compliance
 */
interface SectionShowcaseProps {
  title: string;
  icon: string;
  docs?: string;
  children: React.ReactNode;
}

interface ColorSwatchProps {
  name: string;
  description: string;
  colors: string[];
  usage: string;
}

interface WeatherIconDemoProps {
  code: number;
  label: string;
  isNight?: boolean;
}

/**
 * Design System Showcase Page - Ember Noir v3.0
 *
 * **IMPORTANT**: This page is the SINGLE SOURCE OF TRUTH for UI components.
 * Always reference this page when creating new pages or components.
 *
 * This page exactly mirrors the documentation in docs/design-system.md.
 * Any changes to the design system MUST be reflected in both places.
 *
 * Updated for Phase 16 migration - now uses PageLayout for consistent structure.
 *
 * @see docs/design-system.md for complete technical documentation
 */
export default function DesignSystemPage() {
  const [toggleState, setToggleState] = useState<boolean>(false);
  const [selectValue, setSelectValue] = useState<string>('1');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [showBottomSheet, setShowBottomSheet] = useState<boolean>(false);
  const [checkboxState, setCheckboxState] = useState<boolean>(false);
  const [checkboxIndeterminate, setCheckboxIndeterminate] = useState<boolean>(true);
  const [bottomSheetOpen, setBottomSheetOpen] = useState<boolean>(false);
  const [rightSheetOpen, setRightSheetOpen] = useState<boolean>(false);
  const [leftSheetOpen, setLeftSheetOpen] = useState<boolean>(false);
  const [topSheetOpen, setTopSheetOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [menuCheckboxState, setMenuCheckboxState] = useState<boolean>(false);
  // Dialog Patterns states
  const [showConfirmDefault, setShowConfirmDefault] = useState<boolean>(false);
  const [showConfirmDanger, setShowConfirmDanger] = useState<boolean>(false);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [isConfirmingDefault, setIsConfirmingDefault] = useState<boolean>(false);
  const [isConfirmingDanger, setIsConfirmingDanger] = useState<boolean>(false);

  // Demo schema for FormModal
  const demoFormSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
    email: z.string().email('Invalid email address'),
  });

  // ConfirmationDialog demo handlers
  const handleConfirmDefault = async (): Promise<void> => {
    setIsConfirmingDefault(true);
    await new Promise(r => setTimeout(r, 1500)); // Simulate async
    setIsConfirmingDefault(false);
    setShowConfirmDefault(false);
  };

  const handleConfirmDanger = async (): Promise<void> => {
    setIsConfirmingDanger(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsConfirmingDanger(false);
    setShowConfirmDanger(false);
  };

  // FormModal demo handler
  const handleFormSubmit = async (data: any): Promise<void> => {
    await new Promise(r => setTimeout(r, 1500)); // Simulate API call
  };

  return (
      <PageLayout
        maxWidth="2xl"
        padding="lg"
        header={
          <PageLayout.Header className="text-center pt-6 pb-8">
            <Heading level={1} variant="gradient">
              Ember Noir Design System
            </Heading>
            <Text variant="secondary" size="lg" className="max-w-2xl mx-auto mt-4">
              A sophisticated dark-first design system with warm accents. Version 3.0.
            </Text>
            <div className="mt-6">
              <Banner
                variant="ember"
                title="Reference Guide"
                description="This page mirrors docs/design-system.md exactly. Updated for Phase 16 migration. Use this as your primary reference when building features."
                compact
              />
            </div>
          </PageLayout.Header>
        }
        className="pb-24"
      >
        <div className="space-y-8">

        {/* Table of Contents */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>
              <span className="mr-2">📑</span>
              Indice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {[
                { icon: '📝', title: 'Typography', anchor: 'typography' },
                { icon: '🎨', title: 'Color Palette', anchor: 'color-palette' },
                { icon: '🔘', title: 'Buttons', anchor: 'buttons' },
                { icon: '🃏', title: 'Cards', anchor: 'cards' },
                { icon: '📢', title: 'Banners', anchor: 'banners' },
                { icon: '🏷️', title: 'Status Badges', anchor: 'status-badges' },
                { icon: '🏷️', title: 'Badge (CVA)', anchor: 'badge-cva' },
                { icon: '🏠', title: 'Smart Home', anchor: 'smart-home-components' },
                { icon: '📐', title: 'Layout', anchor: 'layout-components' },
                { icon: '📝', title: 'Form Inputs', anchor: 'form-inputs' },
                { icon: '📊', title: 'Progress Bar', anchor: 'progress-bar' },
                { icon: '🪟', title: 'Modal & Overlays', anchor: 'modal-overlays' },
                { icon: '🪗', title: 'Accordion', anchor: 'accordion' },
                { icon: '📋', title: 'Sheet', anchor: 'sheet' },
                { icon: '🎯', title: 'Action Components', anchor: 'action-components' },
                { icon: '🔔', title: 'Toast', anchor: 'toast-notifications' },
                { icon: '⏳', title: 'Loading States', anchor: 'loading-states' },
                { icon: '🌤️', title: 'Weather Icons', anchor: 'weather-icons' },
                { icon: '📭', title: 'Empty States', anchor: 'empty-states' },
                { icon: '➖', title: 'Dividers', anchor: 'dividers' },
                { icon: '📏', title: 'Spacing Scale', anchor: 'spacing-scale' },
                { icon: '⭕', title: 'Border Radius', anchor: 'border-radius' },
                { icon: '🌑', title: 'Shadow System', anchor: 'shadow-system' },
                { icon: '💬', title: 'Dialog Patterns', anchor: 'dialog-patterns' },
                { icon: '📊', title: 'Data Table', anchor: 'data-table' },
                { icon: '✅', title: 'Best Practices', anchor: 'critical-best-practices' },
              ].map(({ icon, title, anchor }) => (
                <a
                  key={anchor}
                  href={`#${anchor}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                    text-slate-300 hover:text-ember-400
                    bg-white/[0.02] hover:bg-white/[0.06]
                    [html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:hover:text-ember-600
                    [html:not(.dark)_&]:bg-slate-100 [html:not(.dark)_&]:hover:bg-slate-200
                    transition-colors duration-200"
                >
                  <span aria-hidden="true">{icon}</span>
                  <span className="truncate">{title}</span>
                </a>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Typography */}
        <SectionShowcase title="Typography" icon="📝" docs="docs/design-system.md#typography">
          <Card>
            <CardContent>
              {/* Headings */}
              <div className="space-y-6">
                <div>
                  <Text variant="label" size="xs" className="mb-4">Heading Component - All Variants</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Props: level (1-6), size (sm|md|lg|xl|2xl|3xl), variant
                  </Text>
                  <div className="space-y-3">
                    <Heading level={1} variant="default">Heading 1 - Default (slate-100/slate-900)</Heading>
                    <Heading level={2} variant="gradient">Heading 2 - Gradient (ember→flame)</Heading>
                    <Heading level={3} variant="ember">Heading 3 - Ember (ember-400/ember-700)</Heading>
                    <Heading level={4} variant="subtle">Heading 4 - Ocean (ocean-300/ocean-700)</Heading>
                    <Heading level={5} variant="sage">Heading 5 - Sage (sage-400/sage-700)</Heading>
                    <Heading level={6} variant="subtle">Heading 6 - Subtle (slate-400/slate-600)</Heading>
                    <Heading level={3} variant="warning">Heading - Warning (warning-400/warning-700)</Heading>
                    <Heading level={3} variant="danger">Heading - Danger (danger-400/danger-700)</Heading>
                  </div>
                </div>

                <CardDivider />

                {/* Text */}
                <div>
                  <Text variant="label" size="xs" className="mb-4">Text Component - All Variants</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Props: variant, size (xs|sm|base|lg|xl), weight (normal|medium|semibold|bold|black), uppercase, tracking, mono, as (p|span|label|div)
                  </Text>
                  <div className="space-y-2">
                    <Text variant="body">Body Text - Primary (slate-100/slate-900)</Text>
                    <Text variant="secondary">Secondary Text - Descriptions (slate-300/slate-600)</Text>
                    <Text variant="tertiary">Tertiary Text - Captions (slate-400/slate-500)</Text>
                    <Text variant="ember">Ember Accent - Highlighted (ember-400/ember-600)</Text>
                    <Text variant="tertiary">Ocean Accent - Info (ocean-400/ocean-600)</Text>
                    <Text variant="sage">Sage Accent - Success (sage-400/sage-600)</Text>
                    <Text variant="warning">Warning Accent - Attention (warning-400/warning-600)</Text>
                    <Text variant="danger">Danger Accent - Error (danger-400/danger-600)</Text>
                    <Text variant="label">Label Text - auto uppercase tracking-wider</Text>
                    <Text mono variant="tertiary" size="sm">Monospace - code_example</Text>
                  </div>
                </div>

                <CardDivider />

                {/* Font Sizes */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Fluid Typography Scale (clamp)</Text>
                  <div className="space-y-2">
                    <Text size="xs">Extra Small - 0.7rem → 0.8rem (11-13px)</Text>
                    <Text size="sm">Small - 0.8rem → 0.9rem (13-14px)</Text>
                    <Text size="base">Base - 0.9rem → 1rem (14-16px)</Text>
                    <Text size="lg">Large - 1rem → 1.25rem (16-20px)</Text>
                    <Text size="xl">Extra Large - 1.15rem → 1.5rem (18-24px)</Text>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Colors */}
        <SectionShowcase title="Color Palette" icon="🎨" docs="docs/design-system.md#color-palette">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ColorSwatch
              name="Ember (Primary)"
              description="Copper/amber - Primary accent, active states"
              colors={['ember-300', 'ember-400', 'ember-500', 'ember-600', 'ember-700']}
              usage="Primary actions, focus rings, brand elements"
            />
            <ColorSwatch
              name="Flame (High Energy)"
              description="Orange-red - CTAs, stove 'on' state"
              colors={['flame-400', 'flame-500', 'flame-600', 'flame-700']}
              usage="Urgent actions, power on, gradient endpoints"
            />
            <ColorSwatch
              name="Sage (Success)"
              description="Muted green - Success, confirmations"
              colors={['sage-400', 'sage-500', 'sage-600', 'sage-700']}
              usage="Success states, healthy indicators"
            />
            <ColorSwatch
              name="Ocean (Info)"
              description="Muted blue - Info, thermostat"
              colors={['ocean-400', 'ocean-500', 'ocean-600', 'ocean-700']}
              usage="Info banners, links, cooling"
            />
            <ColorSwatch
              name="Warning"
              description="Yellow - Attention needed"
              colors={['warning-400', 'warning-500', 'warning-600', 'warning-700']}
              usage="Warnings, standby states"
            />
            <ColorSwatch
              name="Danger"
              description="Red - Errors, destructive actions"
              colors={['danger-400', 'danger-500', 'danger-600', 'danger-700']}
              usage="Errors, delete actions"
            />
            <ColorSwatch
              name="Slate (Foundation)"
              description="Warm charcoal - Never pure black"
              colors={['slate-400', 'slate-500', 'slate-600', 'slate-700', 'slate-800', 'slate-900', 'slate-950']}
              usage="Backgrounds, text hierarchy, borders"
            />
          </div>
        </SectionShowcase>

        {/* Buttons */}
        <SectionShowcase title="Buttons" icon="🔘" docs="docs/design-system.md#button">
          <Card>
            <CardContent>
              {/* Variants */}
              <div className="space-y-6">
                <div>
                  <Text variant="label" size="xs" className="mb-3">Button Variants</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    ember (primary gradient), subtle (glass), ghost (transparent), success (sage), danger (red), ocean (blue), outline (border only)
                  </Text>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="ember">Ember Primary</Button>
                    <Button variant="subtle">Subtle Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="success">Success</Button>
                    <Button variant="danger">Danger</Button>
                    <Button variant="subtle">Ocean</Button>
                    <Button variant="outline">Outline</Button>
                  </div>
                </div>

                <CardDivider />

                {/* Sizes */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Sizes (iOS 44px min touch target)</Text>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small (44px)</Button>
                    <Button size="md">Medium (48px)</Button>
                    <Button size="lg">Large (56px)</Button>
                  </div>
                </div>

                <CardDivider />

                {/* With Icons */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">With Icons</Text>
                  <div className="flex flex-wrap gap-3">
                    <Button icon="🔥" variant="ember">Start Stove</Button>
                    <Button icon="❄️" variant="subtle" iconPosition="right">Turn Off</Button>
                    <Button icon="🔥" variant="ember" iconOnly size="md" aria-label="Ignite stove" />
                    <ButtonIcon icon="⚙️" aria-label="Settings" variant="ghost" />
                    <ButtonIcon icon="❌" aria-label="Close" variant="danger" size="sm" />
                  </div>
                </div>

                <CardDivider />

                {/* States */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">States</Text>
                  <div className="flex flex-wrap gap-3">
                    <Button loading>Loading...</Button>
                    <Button disabled>Disabled (70% opacity)</Button>
                    <Button disabled variant="subtle">Disabled Subtle</Button>
                  </div>
                  <Text variant="tertiary" size="xs" className="mt-2">
                    Note: Disabled opacity is 70% (not 50%) for better readability with subtle variants
                  </Text>
                </div>

                <CardDivider />

                {/* Button Group */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Button Group</Text>
                  <ButtonGroup>
                    <Button variant="subtle">Cancel</Button>
                    <Button variant="ember">Confirm</Button>
                  </ButtonGroup>
                </div>

                <CardDivider />

                {/* API Reference */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">API Reference</Text>
                  <PropTable props={componentDocs.Button!.props} />
                </div>

                <CardDivider />

                {/* Code Example */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Code Example</Text>
                  <CodeBlock code={componentDocs.Button!.codeExample} />
                </div>

                <CardDivider />

                {/* Accessibility */}
                <AccessibilitySection
                  keyboard={componentDocs.Button!.keyboard}
                  aria={componentDocs.Button!.aria}
                  screenReader={componentDocs.Button!.screenReader}
                />
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Cards */}
        <SectionShowcase title="Cards" icon="🃏" docs="docs/design-system.md#card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="default">
              <CardHeader>
                <CardTitle icon="🔥">Default Card</CardTitle>
              </CardHeader>
              <CardContent>
                <Text variant="secondary">bg-slate-900/80, subtle dark container, best for most use cases</Text>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle icon="⬆️">Elevated Card</CardTitle>
              </CardHeader>
              <CardContent>
                <Text variant="secondary">bg-slate-850/90, stronger shadow, more prominent</Text>
              </CardContent>
            </Card>

            <Card variant="subtle">
              <CardHeader>
                <CardTitle icon="👻">Subtle Card</CardTitle>
              </CardHeader>
              <CardContent>
                <Text variant="secondary">bg-white/[0.03], minimal, for nested/secondary content</Text>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardHeader>
                <CardTitle icon="🔲">Outlined Card</CardTitle>
              </CardHeader>
              <CardContent>
                <Text variant="secondary">bg-transparent, visible border only</Text>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle icon="💎">Glass Card</CardTitle>
              </CardHeader>
              <CardContent>
                <Text variant="secondary">bg-slate-900/70, strong glass effect, backdrop-blur-2xl</Text>
              </CardContent>
            </Card>

            <Card hover glow>
              <CardHeader>
                <CardTitle icon="✨">Hover + Glow</CardTitle>
              </CardHeader>
              <CardContent>
                <Text variant="secondary">Interactive card, hover:-translate-y-0.5, shadow-ember-glow</Text>
              </CardContent>
            </Card>
          </div>

          {/* Card Anatomy */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle icon="🏗️">Complete Card Anatomy</CardTitle>
              <StatusBadge status="EXAMPLE" color="ember" />
            </CardHeader>
            <CardContent>
              <Text variant="secondary" className="mb-2">
                Cards support: CardHeader, CardTitle, CardContent, CardFooter, CardDivider
              </Text>
              <Text variant="tertiary" size="sm">
                Use these semantic components instead of raw divs for consistent spacing and styling.
              </Text>
            </CardContent>
            <CardDivider />
            <CardFooter>
              <ButtonGroup>
                <Button variant="ghost" size="sm">Cancel</Button>
                <Button variant="ember" size="sm">Action</Button>
              </ButtonGroup>
            </CardFooter>
          </Card>
        </SectionShowcase>

        {/* Banners */}
        <SectionShowcase title="Banners" icon="📢" docs="docs/design-system.md#banner">
          <div className="space-y-4">
            <Banner
              variant="info"
              title="Information Banner"
              description="Always use description prop for styled text. Children won't get variant-specific colors!"
            />
            <Banner
              variant="warning"
              title="Warning Banner"
              description="Attention needed. Auto icon: ⚠️"
            />
            <Banner
              variant="error"
              title="Error Banner"
              description="Something went wrong. Auto icon: ❌"
            />
            <Banner
              variant="success"
              title="Success Banner"
              description="Operation completed. Auto icon: ✅"
            />
            <Banner
              variant="ember"
              title="Ember Highlight"
              description="Important announcement with ember glow effect. Auto icon: 🔥"
            />
            <Banner
              variant="info"
              description="Compact banner without title"
              compact
              dismissible
              dismissKey="demo-compact-info"
            />
            <Text variant="warning" size="sm" className="mt-4">
              ⚠️ CRITICAL: Always use description prop! Using children directly will NOT apply variant colors.
            </Text>
          </div>
        </SectionShowcase>

        {/* Status Badges */}
        <SectionShowcase title="Status Badges" icon="🏷️" docs="docs/design-system.md#statusbadge">
          <Card>
            <CardContent>
              <div className="space-y-6">
                {/* Auto-detection */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Auto-Detected Colors & Icons</Text>
                  <Text variant="tertiary" size="sm" className="mb-3">
                    Badge auto-detects color/icon from status text: WORK/ON/ACTIVE → ember, OFF/SPENTO → neutral, ERROR → danger, etc.
                  </Text>
                  <div className="flex flex-wrap gap-3">
                    <StatusBadge status="IN FUNZIONE" />
                    <StatusBadge status="SPENTO" />
                    <StatusBadge status="AVVIO" />
                    <StatusBadge status="STANDBY" />
                    <StatusBadge status="ERROR" />
                    <StatusBadge status="SUCCESS" />
                  </div>
                </div>

                <CardDivider />

                {/* Display Variant */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Display Variant (Large Centered)</Text>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatusBadge variant="display" status="WORKING" size="md" pulse />
                    <StatusBadge variant="display" status="OFF" size="md" />
                    <StatusBadge variant="display" status="STARTING" size="lg" />
                  </div>
                </div>

                <CardDivider />

                {/* Dot Variant */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Dot Variant</Text>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <StatusBadge variant="dot" status="active" color="ember" pulse />
                      <Text variant="secondary" size="sm">Active</Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge variant="dot" status="inactive" color="neutral" />
                      <Text variant="secondary" size="sm">Inactive</Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge variant="dot" status="warning" color="warning" pulse />
                      <Text variant="secondary" size="sm">Warning</Text>
                    </div>
                  </div>
                </div>

                <CardDivider />

                {/* Manual Colors */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Manual Color Override</Text>
                  <div className="flex flex-wrap gap-3">
                    <StatusBadge status="Ember" color="ember" />
                    <StatusBadge status="Sage" color="sage" />
                    <StatusBadge status="Ocean" color="ocean" />
                    <StatusBadge status="Warning" color="warning" />
                    <StatusBadge status="Danger" color="danger" />
                    <StatusBadge status="Neutral" color="neutral" />
                  </div>
                </div>

                <CardDivider />

                {/* Sizes */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Sizes</Text>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status="Small" size="sm" />
                    <StatusBadge status="Medium" size="md" />
                    <StatusBadge status="Large" size="lg" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Badge Component (v3.0+) */}
        <SectionShowcase title="Badge (CVA)" icon="🏷️" docs="docs/design-system.md#badge">
          <Card>
            <CardContent>
              <div className="space-y-6">
                {/* Variants */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Badge Variants</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Props: variant (ember|sage|ocean|warning|danger|neutral), size (sm|md|lg), pulse, icon
                  </Text>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="ember">Ember</Badge>
                    <Badge variant="sage">Sage</Badge>
                    <Badge variant="ocean">Ocean</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="danger">Danger</Badge>
                    <Badge variant="neutral">Neutral</Badge>
                  </div>
                </div>

                <CardDivider />

                {/* Sizes */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Sizes</Text>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="ember" size="sm">Small</Badge>
                    <Badge variant="ember" size="md">Medium</Badge>
                    <Badge variant="ember" size="lg">Large</Badge>
                  </div>
                </div>

                <CardDivider />

                {/* Pulse Animation */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Pulse Animation</Text>
                  <Text variant="tertiary" size="sm" className="mb-3">
                    Use pulse=true for active states (ember, sage, primary, success)
                  </Text>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="ember" pulse>Active</Badge>
                    <Badge variant="sage" pulse>Online</Badge>
                    <Badge variant="neutral">Inactive</Badge>
                  </div>
                </div>

                <CardDivider />

                {/* With Icon */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">With Icon</Text>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="ember" icon="🔥">Heating</Badge>
                    <Badge variant="sage" icon="✓">Connected</Badge>
                    <Badge variant="warning" icon="⚠️">Warning</Badge>
                  </div>
                </div>

                <CardDivider />

                {/* Props Reference */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Props Reference</Text>
                  <PropTable props={componentDocs.Badge!.props} />
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Smart Home Components (v3.0+) */}
        <SectionShowcase title="Smart Home Components" icon="🏠" docs="docs/design-system.md#smart-home">
          <div className="space-y-6">
            {/* ConnectionStatus */}
            <Card>
              <CardContent>
                <Text variant="label" size="xs" className="mb-3">ConnectionStatus</Text>
                <Text variant="tertiary" size="sm" className="mb-4">
                  Props: status (online|offline|connecting|unknown), size (sm|md|lg), label, showDot
                </Text>
                <div className="flex flex-wrap gap-6">
                  <ConnectionStatus status="online" />
                  <ConnectionStatus status="offline" />
                  <ConnectionStatus status="connecting" />
                  <ConnectionStatus status="unknown" />
                </div>
                <div className="mt-4 flex flex-wrap gap-6">
                  <ConnectionStatus status="online" size="sm" />
                  <ConnectionStatus status="online" size="md" />
                  <ConnectionStatus status="online" size="lg" />
                </div>
                <div className="mt-4">
                  <PropTable props={componentDocs.ConnectionStatus!.props} />
                </div>
                <AccessibilitySection
                  keyboard={componentDocs.ConnectionStatus!.keyboard}
                  aria={componentDocs.ConnectionStatus!.aria}
                  screenReader={componentDocs.ConnectionStatus!.screenReader}
                />
              </CardContent>
            </Card>

            {/* HealthIndicator */}
            <Card>
              <CardContent>
                <Text variant="label" size="xs" className="mb-3">HealthIndicator</Text>
                <Text variant="tertiary" size="sm" className="mb-4">
                  Props: status (ok|warning|error|critical), size (sm|md|lg), label, showIcon, pulse
                </Text>
                <div className="flex flex-wrap gap-6">
                  <HealthIndicator status="ok" />
                  <HealthIndicator status="warning" />
                  <HealthIndicator status="error" />
                  <HealthIndicator status="critical" />
                </div>
                <div className="mt-4 flex flex-wrap gap-6">
                  <HealthIndicator status="critical" pulse aria-label="Sistema critico" />
                  <HealthIndicator status="warning" aria-label="Manutenzione richiesta" />
                </div>
                <div className="mt-4">
                  <PropTable props={componentDocs.HealthIndicator!.props} />
                </div>
                <AccessibilitySection
                  keyboard={componentDocs.HealthIndicator!.keyboard}
                  aria={componentDocs.HealthIndicator!.aria}
                  screenReader={componentDocs.HealthIndicator!.screenReader}
                />
              </CardContent>
            </Card>

            {/* SmartHomeCard */}
            <Card>
              <CardContent>
                <Text variant="label" size="xs" className="mb-3">SmartHomeCard</Text>
                <Text variant="tertiary" size="sm" className="mb-4">
                  Base card for device controls. Props: icon, title, size (compact|default), colorTheme, isLoading, error, disabled.
                  Namespace: SmartHomeCard.Header, SmartHomeCard.Status, SmartHomeCard.Controls
                </Text>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SmartHomeCard icon="🌡️" title="Thermostat" colorTheme="ember">
                <SmartHomeCard.Status>
                  <Badge variant="ember" pulse>Riscaldamento</Badge>
                </SmartHomeCard.Status>
                <SmartHomeCard.Controls>
                  <Text variant="secondary">22°C → 24°C</Text>
                </SmartHomeCard.Controls>
              </SmartHomeCard>

              <SmartHomeCard icon="💡" title="Luci" colorTheme="sage" size="compact">
                <SmartHomeCard.Status>
                  <Badge variant="sage">Accese</Badge>
                </SmartHomeCard.Status>
                <SmartHomeCard.Controls>
                  <Text variant="secondary" size="sm">3 luci attive</Text>
                </SmartHomeCard.Controls>
              </SmartHomeCard>
            </div>
            <Card variant="subtle">
              <CardContent>
                <PropTable props={componentDocs.SmartHomeCard!.props} />
                <div className="mt-4">
                  <Text variant="tertiary" size="xs" className="mb-2">Usage</Text>
                  <CodeBlock code={componentDocs.SmartHomeCard!.codeExample} />
                </div>
                <AccessibilitySection
                  keyboard={componentDocs.SmartHomeCard!.keyboard}
                  aria={componentDocs.SmartHomeCard!.aria}
                  screenReader={componentDocs.SmartHomeCard!.screenReader}
                />
              </CardContent>
            </Card>

            {/* StatusCard */}
            <Card>
              <CardContent>
                <Text variant="label" size="xs" className="mb-3">StatusCard</Text>
                <Text variant="tertiary" size="sm" className="mb-4">
                  Extends SmartHomeCard with integrated Badge and ConnectionStatus.
                  Props: status, statusVariant, connectionStatus
                </Text>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatusCard
                icon="🔥"
                title="Stufa"
                status="In funzione"
                statusVariant="ember"
                connectionStatus="online"
                colorTheme="ember"
              />
              <StatusCard
                icon="📹"
                title="Camera"
                status="Spenta"
                statusVariant="neutral"
                connectionStatus="offline"
                colorTheme="ocean"
                size="compact"
              />
            </div>
            <Card variant="subtle">
              <CardContent>
                <PropTable props={componentDocs.StatusCard!.props} />
                <AccessibilitySection
                  keyboard={componentDocs.StatusCard!.keyboard}
                  aria={componentDocs.StatusCard!.aria}
                  screenReader={componentDocs.StatusCard!.screenReader}
                />
              </CardContent>
            </Card>

            {/* ControlButton */}
            <Card>
              <CardContent>
                <Text variant="label" size="xs" className="mb-3">ControlButton</Text>
                <Text variant="tertiary" size="sm" className="mb-4">
                  Increment/decrement button with long-press support and haptic feedback.
                  Props: type (increment|decrement), variant, size, step, onChange, longPressDelay, longPressInterval, haptic
                </Text>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <ControlButton type="decrement" size="sm" variant="subtle" onChange={() => {}} />
                    <Text variant="secondary">Value</Text>
                    <ControlButton type="increment" size="sm" variant="subtle" onChange={() => {}} />
                  </div>
                  <div className="flex items-center gap-2">
                    <ControlButton type="decrement" size="md" variant="ember" onChange={() => {}} />
                    <Text variant="ember">22°C</Text>
                    <ControlButton type="increment" size="md" variant="ember" onChange={() => {}} />
                  </div>
                </div>
                <Text variant="tertiary" size="xs" className="mt-3">
                  Long-press: hold button to continuously increment/decrement
                </Text>
                <div className="mt-4">
                  <PropTable props={componentDocs.ControlButton!.props} />
                </div>
                <div className="mt-4">
                  <Text variant="tertiary" size="xs" className="mb-2">Usage</Text>
                  <CodeBlock code={componentDocs.ControlButton!.codeExample} />
                </div>
                <AccessibilitySection
                  keyboard={componentDocs.ControlButton!.keyboard}
                  aria={componentDocs.ControlButton!.aria}
                  screenReader={componentDocs.ControlButton!.screenReader}
                />
              </CardContent>
            </Card>
          </div>
        </SectionShowcase>

        {/* Layout Components (v3.0+) */}
        <SectionShowcase title="Layout Components" icon="📐" docs="docs/design-system.md#layout">
          <div className="space-y-6">
            {/* PageLayout */}
            <Card>
              <CardContent>
                <Text variant="label" size="xs" className="mb-3">PageLayout</Text>
                <Text variant="tertiary" size="sm" className="mb-4">
                  Consistent page structure with header, content, and footer slots.
                  Props: header (slot), footer (slot), maxWidth (sm|md|lg|xl|2xl|full), padding (none|sm|md|lg), centered
                </Text>
                <Banner
                  variant="info"
                  description="This page uses PageLayout for consistent structure. See the page wrapper implementation."
                  compact
                />
              </CardContent>
            </Card>

            {/* Section */}
            <Card>
              <CardContent>
                <Text variant="label" size="xs" className="mb-3">Section</Text>
                <Text variant="tertiary" size="sm" className="mb-4">
                  Semantic section wrapper with title, description, and optional action.
                  Props: title, subtitle, description, spacing (none|sm|md|lg), level (1-6), action, as
                </Text>
              </CardContent>
            </Card>
            <Section
              title="Example Section"
              description="This demonstrates the Section component with title and description"
              spacing="sm"
              level={3}
              action={<Button variant="subtle" size="sm">Action</Button>}
            >
              <Card variant="subtle">
                <CardContent>
                  <Text variant="secondary" size="sm">
                    Section provides consistent styling for page sections with gradient accent bar, responsive title/action layout, and configurable spacing.
                  </Text>
                </CardContent>
              </Card>
            </Section>

            {/* Grid */}
            <Card>
              <CardContent>
                <Text variant="label" size="xs" className="mb-3">Grid</Text>
                <Text variant="tertiary" size="sm" className="mb-4">
                  Responsive grid system with predefined column patterns.
                  Props: cols (1-6), gap (none|sm|md|lg), as (element type)
                </Text>
                <div className="mt-4">
                  <Text variant="tertiary" size="xs" className="mb-2">3-column grid</Text>
                  <Grid cols={3} gap="sm">
                    <Card variant="subtle" className="p-4"><Text variant="secondary" size="sm">Item 1</Text></Card>
                    <Card variant="subtle" className="p-4"><Text variant="secondary" size="sm">Item 2</Text></Card>
                    <Card variant="subtle" className="p-4"><Text variant="secondary" size="sm">Item 3</Text></Card>
                  </Grid>
                </div>
                <div className="mt-4">
                  <Text variant="tertiary" size="xs" className="mb-2">2-column grid</Text>
                  <Grid cols={2} gap="md">
                    <Card variant="subtle" className="p-4"><Text variant="secondary" size="sm">Left</Text></Card>
                    <Card variant="subtle" className="p-4"><Text variant="secondary" size="sm">Right</Text></Card>
                  </Grid>
                </div>
              </CardContent>
            </Card>

            {/* Tooltip */}
            <Card>
              <CardContent>
                <Text variant="label" size="xs" className="mb-3">Tooltip</Text>
                <Text variant="tertiary" size="sm" className="mb-4">
                  Radix-based tooltip with Ember Noir styling. Accessible with keyboard and screen reader support.
                  Props: content, side (top|right|bottom|left), open, onOpenChange
                </Text>
                <Tooltip.Provider>
                  <div className="flex flex-wrap gap-4">
                    <Tooltip content="Tooltip on top">
                      <Button variant="subtle" size="sm">Hover me (top)</Button>
                    </Tooltip>
                    <Tooltip content="Tooltip on right" side="right">
                      <Button variant="subtle" size="sm">Hover me (right)</Button>
                    </Tooltip>
                    <Tooltip content="Tooltip on bottom" side="bottom">
                      <Button variant="subtle" size="sm">Hover me (bottom)</Button>
                    </Tooltip>
                    <Tooltip content="Tooltip on left" side="left">
                      <Button variant="subtle" size="sm">Hover me (left)</Button>
                    </Tooltip>
                  </div>
                </Tooltip.Provider>
                <Text variant="tertiary" size="xs" className="mt-3">
                  Features: 400ms show delay, 300ms skip delay, arrow indicator, keyboard accessible
                </Text>
              </CardContent>
            </Card>

            {/* Spinner */}
            <Card>
              <CardContent>
                <Text variant="label" size="xs" className="mb-3">Spinner</Text>
                <Text variant="tertiary" size="sm" className="mb-4">
                  Animated loading indicator with accessible SVG. Use inside buttons or as standalone.
                  Props: size (xs|sm|md|lg|xl), variant (ember|white|current|muted), label
                </Text>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="xs" />
                    <Text variant="tertiary" size="xs">xs</Text>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="sm" />
                    <Text variant="tertiary" size="xs">sm</Text>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="md" />
                    <Text variant="tertiary" size="xs">md</Text>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="lg" />
                    <Text variant="tertiary" size="xs">lg</Text>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="xl" />
                    <Text variant="tertiary" size="xs">xl</Text>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <Spinner variant="ember" aria-label="Loading" />
                  <Spinner variant="white" aria-label="Loading" />
                  <Spinner variant="muted" aria-label="Loading" />
                  <Text variant="tertiary" size="xs">Variants: ember, white, muted</Text>
                </div>
              </CardContent>
            </Card>
          </div>
        </SectionShowcase>

        {/* Form Inputs */}
        <SectionShowcase title="Form Inputs" icon="📝" docs="docs/design-system.md#form-inputs">
          <Card>
            <CardContent>
              <div className="space-y-8">
                {/* Input Component */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Input Component</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Props: type, label, icon, variant (default|ember|ocean), error, helperText, disabled
                  </Text>
                  <div className="space-y-4 max-w-md">
                    <Input
                      aria-label="Text Input"
                      placeholder="Enter text..."
                      icon="📧"
                      autoComplete="off" data-lpignore="true" data-1p-ignore
                    />
                    <Input
                      aria-label="Password Input"
                      type="password"
                      placeholder="Enter password..."
                      icon="🔒"
                      autoComplete="off" data-lpignore="true" data-1p-ignore
                    />
                    <Input
                      aria-label="Input with Variant"
                      placeholder="Default variant..."
                      icon="🌊"
                      variant="default"
                      autoComplete="off" data-lpignore="true" data-1p-ignore
                    />
                    <Input
                      aria-label="Input with Helper Text"
                      placeholder="Enter text..."
                      helperText="This is helper text that provides additional context"
                      autoComplete="off" data-lpignore="true" data-1p-ignore
                    />
                    <Input
                      aria-label="Input with Error"
                      placeholder="Enter text..."
                      error="This field is required"
                      autoComplete="off" data-lpignore="true" data-1p-ignore
                    />
                    <Input
                      aria-label="Disabled Input"
                      placeholder="Disabled..."
                      disabled
                      value="Cannot edit"
                      autoComplete="off" data-lpignore="true" data-1p-ignore
                    />
                  </div>
                  <div className="mt-4">
                    <Text variant="tertiary" size="xs" className="mb-2">Props Reference</Text>
                    <PropTable props={componentDocs.Input!.props} />
                  </div>
                  <div className="mt-4">
                    <Text variant="tertiary" size="xs" className="mb-2">Usage</Text>
                    <CodeBlock code={componentDocs.Input!.codeExample} />
                  </div>
                  <AccessibilitySection
                    keyboard={componentDocs.Input!.keyboard}
                    aria={componentDocs.Input!.aria}
                    screenReader={componentDocs.Input!.screenReader}
                  />
                </div>

                <CardDivider />

                {/* Select Component */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Select Component</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Props: label, icon, options (array of {"{value, label, disabled?}"}), value, onChange, disabled, variant (default|ember|ocean)
                  </Text>
                  <div className="space-y-4 max-w-md">
                    <Select
                      label="Select Dropdown"
                      icon="🎯"
                      options={[
                        { value: '1', label: 'Option 1' },
                        { value: '2', label: 'Option 2' },
                        { value: '3', label: 'Option 3' },
                        { value: '4', label: 'Disabled Option', disabled: true },
                      ]}
                      value={selectValue}
                      onChange={(e) => setSelectValue(String(e.target.value))}
                    />
                    <Select
                      label="Select with Variant"
                      icon="🌊"
                      variant="ocean"
                      options={[
                        { value: 'a', label: 'Ocean Option A' },
                        { value: 'b', label: 'Ocean Option B' },
                        { value: 'c', label: 'Ocean Option C' },
                      ]}
                      value="a"
                      onChange={() => {}}
                    />
                    <Select
                      label="Disabled Select"
                      icon="🚫"
                      disabled
                      options={[
                        { value: '1', label: 'Cannot select' },
                      ]}
                      value="1"
                      onChange={() => {}}
                    />
                  </div>
                  <div className="mt-4">
                    <Text variant="tertiary" size="xs" className="mb-2">Props Reference</Text>
                    <PropTable props={componentDocs.Select!.props} />
                  </div>
                  <div className="mt-4">
                    <Text variant="tertiary" size="xs" className="mb-2">Usage</Text>
                    <CodeBlock code={componentDocs.Select!.codeExample} />
                  </div>
                  <AccessibilitySection
                    keyboard={componentDocs.Select!.keyboard}
                    aria={componentDocs.Select!.aria}
                    screenReader={componentDocs.Select!.screenReader}
                  />
                </div>

                <CardDivider />

                {/* Toggle Component */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Toggle Component</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Props: checked, onChange, label (required for a11y), disabled, size (sm|md|lg), variant (ember|ocean|sage)
                  </Text>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={toggleState}
                        onCheckedChange={setToggleState}
                        aria-label="Default Toggle"
                      />
                      <Text variant="secondary" size="sm">Default (Ember) - Interactive</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={true}
                        onChange={() => {}}
                        aria-label="Ocean Variant"
                        variant="ocean"
                      />
                      <Text variant="secondary" size="sm">Ocean Variant</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={true}
                        onChange={() => {}}
                        aria-label="Sage Variant"
                        variant="sage"
                      />
                      <Text variant="secondary" size="sm">Sage Variant</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={false}
                        onChange={() => {}}
                        aria-label="Small Size"
                        size="sm"
                      />
                      <Toggle
                        checked={false}
                        onChange={() => {}}
                        aria-label="Medium Size"
                        size="md"
                      />
                      <Toggle
                        checked={false}
                        onChange={() => {}}
                        aria-label="Large Size"
                        size="lg"
                      />
                      <Text variant="tertiary" size="xs" className="ml-2">Sizes: sm (h-6), md (h-8), lg (h-10)</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={false}
                        onChange={() => {}}
                        aria-label="Disabled Toggle"
                        disabled
                      />
                      <Text variant="secondary" size="sm">Disabled State</Text>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Text variant="tertiary" size="xs" className="mb-2">Props Reference</Text>
                    <PropTable props={componentDocs.Switch!.props} />
                  </div>
                  <div className="mt-4">
                    <Text variant="tertiary" size="xs" className="mb-2">Usage</Text>
                    <CodeBlock code={componentDocs.Switch!.codeExample} />
                  </div>
                  <AccessibilitySection
                    keyboard={componentDocs.Switch!.keyboard}
                    aria={componentDocs.Switch!.aria}
                    screenReader={componentDocs.Switch!.screenReader}
                  />
                </div>

                <CardDivider />

                {/* Checkbox Component */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Checkbox Component</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Props: checked, onChange, label, disabled, indeterminate, size (sm|md|lg), variant (primary|ocean|sage|ember|flame)
                  </Text>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="checkbox-1"
                        checked={checkboxState}
                        onChange={(e) => setCheckboxState('checked' in e.target ? e.target.checked : false)}
                        aria-label="Interactive Checkbox"
                      />
                      <Text variant="secondary" size="sm">Default (Ocean) - Click to toggle</Text>
                    </div>

                    <div>
                      <Text variant="tertiary" size="xs" className="mb-2">Variants</Text>
                      <div className="flex flex-wrap gap-4">
                        <Checkbox
                          id="checkbox-primary"
                          checked={true}
                          onChange={() => {}}
                          aria-label="Primary"
                          variant="ember"
                        />
                        <Checkbox
                          id="checkbox-ocean"
                          checked={true}
                          onChange={() => {}}
                          aria-label="Ocean"
                          variant="ocean"
                        />
                        <Checkbox
                          id="checkbox-sage"
                          checked={true}
                          onChange={() => {}}
                          aria-label="Sage"
                          variant="sage"
                        />
                        <Checkbox
                          id="checkbox-ember"
                          checked={true}
                          onChange={() => {}}
                          aria-label="Ember"
                          variant="ember"
                        />
                        <Checkbox
                          id="checkbox-flame"
                          checked={true}
                          onChange={() => {}}
                          aria-label="Flame"
                          variant="flame"
                        />
                      </div>
                    </div>

                    <div>
                      <Text variant="tertiary" size="xs" className="mb-2">Sizes</Text>
                      <div className="flex items-center gap-4">
                        <Checkbox
                          id="checkbox-sm"
                          checked={true}
                          onChange={() => {}}
                          aria-label="Small"
                          size="sm"
                        />
                        <Checkbox
                          id="checkbox-md"
                          checked={true}
                          onChange={() => {}}
                          aria-label="Medium"
                          size="md"
                        />
                        <Checkbox
                          id="checkbox-lg"
                          checked={true}
                          onChange={() => {}}
                          aria-label="Large"
                          size="lg"
                        />
                      </div>
                    </div>

                    <div>
                      <Text variant="tertiary" size="xs" className="mb-2">States</Text>
                      <div className="flex flex-wrap gap-4">
                        <Checkbox
                          id="checkbox-checked"
                          checked={true}
                          onChange={() => {}}
                          aria-label="Checked"
                        />
                        <Checkbox
                          id="checkbox-unchecked"
                          checked={false}
                          onChange={() => {}}
                          aria-label="Unchecked"
                        />
                        <Checkbox
                          id="checkbox-indeterminate"
                          indeterminate={checkboxIndeterminate}
                          onChange={() => setCheckboxIndeterminate(!checkboxIndeterminate)}
                          aria-label="Indeterminate"
                        />
                        <Checkbox
                          id="checkbox-disabled"
                          checked={false}
                          onChange={() => {}}
                          aria-label="Disabled"
                          disabled
                        />
                        <Checkbox
                          id="checkbox-disabled-checked"
                          checked={true}
                          onChange={() => {}}
                          aria-label="Disabled Checked"
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <Text variant="tertiary" size="xs" className="mb-2">Without Label</Text>
                      <div className="flex items-center gap-4">
                        <Checkbox
                          id="checkbox-no-label-1"
                          checked={true}
                          onChange={() => {}}
                        />
                        <Checkbox
                          id="checkbox-no-label-2"
                          checked={false}
                          onChange={() => {}}
                        />
                        <Text variant="secondary" size="sm">Use aria-label when omitting visible label</Text>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Text variant="tertiary" size="xs" className="mb-2">Props Reference</Text>
                      <PropTable props={componentDocs.Checkbox!.props} />
                    </div>
                    <div className="mt-4">
                      <Text variant="tertiary" size="xs" className="mb-2">Usage</Text>
                      <CodeBlock code={componentDocs.Checkbox!.codeExample} />
                    </div>
                    <AccessibilitySection
                      keyboard={componentDocs.Checkbox!.keyboard}
                      aria={componentDocs.Checkbox!.aria}
                      screenReader={componentDocs.Checkbox!.screenReader}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Progress Bar */}
        <SectionShowcase title="Progress Bar" icon="📊" docs="docs/design-system.md#progressbar">
          <Card>
            <CardContent>
              <div className="space-y-6">
                {/* Variants */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Progress Bar Variants</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Props: value (0-100), variant (ember|ocean|sage|warning|danger), size (sm|md|lg), animated, label, leftContent, rightContent
                  </Text>
                  <div className="space-y-4">
                    <ProgressBar value={75} variant="ember" aria-label="Ember Progress" />
                    <ProgressBar value={60} variant="ocean" aria-label="Ocean Progress" />
                    <ProgressBar value={85} variant="sage" aria-label="Sage Progress" />
                    <ProgressBar value={40} variant="warning" aria-label="Warning Progress" />
                    <ProgressBar value={25} variant="danger" aria-label="Danger Progress" />
                  </div>
                </div>

                <CardDivider />

                {/* Sizes */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Sizes</Text>
                  <div className="space-y-4">
                    <ProgressBar value={65} size="sm" variant="ember" aria-label="Small (h-2)" />
                    <ProgressBar value={65} size="md" variant="ember" aria-label="Medium (h-3)" />
                    <ProgressBar value={65} size="lg" variant="ember" aria-label="Large (h-4)" />
                  </div>
                </div>

                <CardDivider />

                {/* With Custom Content */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">With Custom Content</Text>
                  <div className="space-y-4">
                    <ProgressBar
                      value={80}
                      variant="ember"
                      leftContent={<Text variant="ember" size="sm">🔥 Power</Text>}
                      rightContent={<Text variant="secondary" size="sm">80%</Text>}
                    />
                    <ProgressBar
                      value={45}
                      variant="ocean"
                      leftContent={<Text variant="tertiary" size="sm">💨 Fan</Text>}
                      rightContent={<Text variant="secondary" size="sm">45%</Text>}
                    />
                    <ProgressBar
                      value={92}
                      variant="warning"
                      leftContent={<Text variant="warning" size="sm">⏱️ Maintenance</Text>}
                      rightContent={<Text variant="warning" size="sm">92h / 100h</Text>}
                    />
                  </div>
                </div>

                <CardDivider />

                {/* Animated */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Animation</Text>
                  <Text variant="tertiary" size="sm" className="mb-3">
                    animated=true adds smooth transitions (500ms duration)
                  </Text>
                  <ProgressBar value={70} variant="sage" animated aria-label="Animated Progress" />
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Modal & Overlays */}
        <SectionShowcase title="Modal & Overlays" icon="🪟" docs="docs/design-system.md#modal">
          <Card>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Text variant="label" size="xs" className="mb-3">Modal Component</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Props: isOpen, onClose, children, maxWidth (max-w-*), closeOnOverlayClick (default: true), closeOnEscape (default: true)
                  </Text>
                  <Button variant="ember" onClick={() => setShowModal(true)}>
                    Open Modal
                  </Button>
                  <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    maxWidth="max-w-md"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle icon="🪟">Example Modal</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Text variant="secondary" className="mb-4">
                          This is a modal dialog. It blocks scroll, closes on Escape key, and creates a portal at document body level.
                        </Text>
                        <Text variant="tertiary" size="sm">
                          Features: React Portal, scroll lock, backdrop overlay, Escape key support
                        </Text>
                      </CardContent>
                      <CardFooter>
                        <ButtonGroup>
                          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                          <Button variant="ember" onClick={() => setShowModal(false)}>Confirm</Button>
                        </ButtonGroup>
                      </CardFooter>
                    </Card>
                  </Modal>
                  <div className="mt-4">
                    <PropTable props={componentDocs.Modal!.props} />
                  </div>
                  <AccessibilitySection
                    keyboard={componentDocs.Modal!.keyboard}
                    aria={componentDocs.Modal!.aria}
                    screenReader={componentDocs.Modal!.screenReader}
                  />
                </div>

                <CardDivider />

                {/* ConfirmDialog Component */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">ConfirmDialog Component</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Props: isOpen, title, message, confirmText, cancelText, confirmVariant, onConfirm, onCancel, icon
                  </Text>
                  <Button variant="danger" onClick={() => setShowConfirmDialog(true)}>
                    Open Confirm Dialog
                  </Button>
                  <ConfirmDialog
                    isOpen={showConfirmDialog}
                    title="Conferma eliminazione"
                    message="Sei sicuro di voler eliminare questo elemento? L'azione non può essere annullata."
                    confirmText="Elimina"
                    cancelText="Annulla"
                    confirmVariant="danger"
                    icon="⚠️"
                    onConfirm={() => {
                      setShowConfirmDialog(false);
                      // Action here
                    }}
                    onCancel={() => setShowConfirmDialog(false)}
                  />
                  <Text variant="tertiary" size="sm" className="mt-3">
                    Features: Scroll lock, Escape key, backdrop click, centered modal, customizable variants
                  </Text>
                </div>

                <CardDivider />

                {/* BottomSheet Component */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">BottomSheet Component</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Props: isOpen, onClose, title, icon, showCloseButton, showHandle, closeOnBackdrop, className
                  </Text>
                  <Button variant="subtle" onClick={() => setShowBottomSheet(true)}>
                    Open Bottom Sheet
                  </Button>
                  <BottomSheet
                    isOpen={showBottomSheet}
                    onClose={() => setShowBottomSheet(false)}
                    title="Bottom Sheet Example"
                    icon="📱"
                    showCloseButton
                    showHandle
                  >
                    <div className="space-y-4">
                      <Text variant="secondary">
                        Mobile-friendly bottom sheet with scroll lock, drag handle, and smooth animations.
                      </Text>
                      <Text variant="tertiary" size="sm">
                        Perfect for mobile interfaces and quick actions.
                      </Text>
                      <div className="space-y-2 pt-4">
                        <Button variant="ember" className="w-full">Primary Action</Button>
                        <Button variant="subtle" className="w-full">Secondary Action</Button>
                        <Button variant="ghost" className="w-full" onClick={() => setShowBottomSheet(false)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </BottomSheet>
                  <Text variant="tertiary" size="sm" className="mt-3">
                    Features: React Portal, scroll lock, drag handle, Escape key, backdrop blur, max-h-[85vh]
                  </Text>
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Accordion Component */}
        <SectionShowcase title="Accordion" icon="🪗" docs="app/components/ui/Accordion.js">
          <Card>
            <CardContent>
              <div className="space-y-6">
                {/* Single Mode */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Single Mode (FAQ Pattern)</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    type="single" - Only one item open at a time. Collapsible allows closing all.
                  </Text>
                  <Accordion type="single" collapsible defaultValue="faq-1">
                    <Accordion.Item value="faq-1">
                      <Accordion.Trigger>Come posso programmare la stufa?</Accordion.Trigger>
                      <Accordion.Content>
                        Puoi programmare la stufa usando la sezione Schedule nel pannello di
                        controllo. Imposta orari e temperature per ogni giorno della settimana.
                      </Accordion.Content>
                    </Accordion.Item>
                    <Accordion.Item value="faq-2">
                      <Accordion.Trigger>Cosa significa "needsCleaning"?</Accordion.Trigger>
                      <Accordion.Content>
                        La stufa richiede manutenzione quando ha funzionato per il numero
                        di ore configurato. L'accensione automatica viene bloccata fino
                        alla pulizia.
                      </Accordion.Content>
                    </Accordion.Item>
                    <Accordion.Item value="faq-3">
                      <Accordion.Trigger>Come funziona il termostato?</Accordion.Trigger>
                      <Accordion.Content>
                        Il termostato Netatmo si collega via WiFi e permette di controllare
                        la temperatura ambiente. Supporta modalita manuale, programmata e
                        assente.
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion>
                </div>

                <CardDivider />

                {/* Multiple Mode */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Multiple Mode (Info Sections)</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    type="multiple" - Multiple items can be open simultaneously
                  </Text>
                  <Accordion type="multiple" defaultValue={['info-1', 'info-2']}>
                    <Accordion.Item value="info-1">
                      <Accordion.Trigger>Informazioni dispositivo</Accordion.Trigger>
                      <Accordion.Content>
                        Modello: Thermorossi 1000<br/>
                        Firmware: v2.4.1<br/>
                        Ultima connessione: Oggi, 10:30
                      </Accordion.Content>
                    </Accordion.Item>
                    <Accordion.Item value="info-2">
                      <Accordion.Trigger>Statistiche di utilizzo</Accordion.Trigger>
                      <Accordion.Content>
                        Ore totali: 1,234h<br/>
                        Consumo pellet: ~500kg/stagione<br/>
                        Efficienza: 92%
                      </Accordion.Content>
                    </Accordion.Item>
                    <Accordion.Item value="info-3">
                      <Accordion.Trigger>Manutenzione programmata</Accordion.Trigger>
                      <Accordion.Content>
                        Prossima pulizia: tra 48 ore<br/>
                        Ultimo servizio: 2026-01-15
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion>
                </div>

                <CardDivider />

                {/* Features */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Features</Text>
                  <div className="space-y-2">
                    <Text variant="tertiary" size="sm">Keyboard: Arrow keys navigate, Enter/Space toggle, Home/End jump</Text>
                    <Text variant="tertiary" size="sm">Animation: Smooth height with Radix CSS variables (--radix-accordion-content-height)</Text>
                    <Text variant="tertiary" size="sm">Accessibility: aria-expanded, aria-controls, focus ring</Text>
                    <Text variant="tertiary" size="sm">Touch: 48px minimum height for mobile</Text>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Sheet Component */}
        <SectionShowcase title="Sheet" icon="📋" docs="app/components/ui/Sheet.js">
          <Card>
            <CardContent>
              <div className="space-y-6">
                {/* Trigger Buttons */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Sheet Sides</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Sheet slides in from edge. Common patterns: bottom (mobile), right (detail panel), left (nav)
                  </Text>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="subtle" onClick={() => setBottomSheetOpen(true)}>
                      Bottom Sheet
                    </Button>
                    <Button variant="subtle" onClick={() => setRightSheetOpen(true)}>
                      Right Sheet
                    </Button>
                    <Button variant="subtle" onClick={() => setLeftSheetOpen(true)}>
                      Left Sheet
                    </Button>
                    <Button variant="subtle" onClick={() => setTopSheetOpen(true)}>
                      Top Sheet
                    </Button>
                  </div>
                </div>

                {/* Bottom Sheet */}
                <Sheet open={bottomSheetOpen} onOpenChange={setBottomSheetOpen}>
                  <Sheet.Content side="bottom" size="md">
                    <Sheet.Header>
                      <Sheet.Title>Impostazioni Stufa</Sheet.Title>
                      <Sheet.Description>
                        Configura i parametri della tua stufa
                      </Sheet.Description>
                    </Sheet.Header>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center justify-between">
                        <Text>Temperatura target</Text>
                        <Text className="text-ember-400">22°C</Text>
                      </div>
                      <div className="flex items-center justify-between">
                        <Text>Modalita</Text>
                        <Text className="text-ember-400">Automatica</Text>
                      </div>
                    </div>
                    <Sheet.Footer>
                      <Button variant="subtle" onClick={() => setBottomSheetOpen(false)}>
                        Annulla
                      </Button>
                      <Button variant="ember" onClick={() => setBottomSheetOpen(false)}>
                        Salva
                      </Button>
                    </Sheet.Footer>
                  </Sheet.Content>
                </Sheet>

                {/* Right Sheet */}
                <Sheet open={rightSheetOpen} onOpenChange={setRightSheetOpen}>
                  <Sheet.Content side="right" size="md">
                    <Sheet.Header>
                      <Sheet.Title>Dettagli Dispositivo</Sheet.Title>
                      <Sheet.Description>Stufa Thermorossi</Sheet.Description>
                    </Sheet.Header>
                    <div className="space-y-4 py-4">
                      <div>
                        <Text variant="body" size="sm" className="text-slate-400">Stato</Text>
                        <Text className="text-sage-400">Online</Text>
                      </div>
                      <div>
                        <Text variant="body" size="sm" className="text-slate-400">Temperatura</Text>
                        <Text className="text-3xl font-display">21°C</Text>
                      </div>
                      <div>
                        <Text variant="body" size="sm" className="text-slate-400">Ore di funzionamento</Text>
                        <Text>1,234h</Text>
                      </div>
                    </div>
                  </Sheet.Content>
                </Sheet>

                {/* Left Sheet */}
                <Sheet open={leftSheetOpen} onOpenChange={setLeftSheetOpen}>
                  <Sheet.Content side="left" size="sm">
                    <Sheet.Header>
                      <Sheet.Title>Menu</Sheet.Title>
                    </Sheet.Header>
                    <nav className="space-y-2 py-4">
                      <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                      <Button variant="ghost" className="w-full justify-start">Dispositivi</Button>
                      <Button variant="ghost" className="w-full justify-start">Impostazioni</Button>
                      <Button variant="ghost" className="w-full justify-start">Aiuto</Button>
                    </nav>
                  </Sheet.Content>
                </Sheet>

                {/* Top Sheet */}
                <Sheet open={topSheetOpen} onOpenChange={setTopSheetOpen}>
                  <Sheet.Content side="top" size="sm">
                    <Sheet.Header>
                      <Sheet.Title>Notifica</Sheet.Title>
                      <Sheet.Description>
                        La stufa ha completato il ciclo di riscaldamento.
                      </Sheet.Description>
                    </Sheet.Header>
                    <Sheet.Footer>
                      <Button variant="ember" onClick={() => setTopSheetOpen(false)}>
                        OK
                      </Button>
                    </Sheet.Footer>
                  </Sheet.Content>
                </Sheet>

                <CardDivider />

                {/* Features */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Features</Text>
                  <div className="space-y-2">
                    <Text variant="tertiary" size="sm">Built on: Radix Dialog primitive with focus trap</Text>
                    <Text variant="tertiary" size="sm">Sizes: sm, md, lg (width for left/right, height for top/bottom)</Text>
                    <Text variant="tertiary" size="sm">Close: ESC key, backdrop click, close button</Text>
                    <Text variant="tertiary" size="sm">iOS: Safe area padding on bottom sheet (pb-safe)</Text>
                    <Text variant="tertiary" size="sm">Animation: Slide from edge with backdrop fade</Text>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Action Components */}
        <SectionShowcase title="Action Components" icon="🎯" docs="app/components/ui/CommandPalette.tsx">
          <Card>
            <CardContent>
              <Text variant="secondary" className="mb-6">
                Command palettes for quick actions and power-user navigation.
              </Text>

              {/* Kbd Component */}
              <div className="mb-8">
                <Text variant="label" size="xs" className="mb-3">Kbd (Keyboard Shortcut)</Text>
                <div className="flex flex-wrap gap-4 mb-4">
                  <Kbd>Cmd+K</Kbd>
                  <Kbd>Ctrl+K</Kbd>
                  <Kbd>Enter</Kbd>
                  <Kbd>Esc</Kbd>
                  <Kbd>Arrow Down</Kbd>
                </div>
                <Text variant="tertiary" size="sm">
                  Display keyboard shortcuts with consistent styling. Monospace font, bordered appearance.
                </Text>
              </div>

              <CardDivider />

              {/* CommandPalette Component */}
              <div className="mt-6">
                <Text variant="label" size="xs" className="mb-3">CommandPalette</Text>
                <Text variant="tertiary" size="sm" className="mb-4">
                  Built on cmdk library with fuzzy search. Global Cmd+K/Ctrl+K shortcut support.
                </Text>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <Button variant="ember" onClick={() => setCommandPaletteOpen(true)}>
                    Open Command Palette
                  </Button>
                  <Text variant="secondary" size="sm">
                    or press <Kbd>Cmd+K</Kbd>
                  </Text>
                </div>

                <CommandPalette
                  open={commandPaletteOpen}
                  onOpenChange={setCommandPaletteOpen}
                  commands={[
                    {
                      heading: 'Navigation',
                      items: [
                      ]
                    },
                    {
                      heading: 'Actions',
                      items: [
                      ]
                    },
                  ]}
                />

                <div className="mt-4 space-y-2">
                  <Text variant="label" size="xs">Features:</Text>
                  <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 [html:not(.dark)_&]:text-slate-600">
                    <li>Global <Kbd>Cmd+K</Kbd> / <Kbd>Ctrl+K</Kbd> shortcut</li>
                    <li>Fuzzy search filtering</li>
                    <li>Arrow key navigation with wrapping</li>
                    <li>Grouped commands with section headers</li>
                    <li>Full-screen on mobile</li>
                    <li>Haptic feedback on selection</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Toast Notifications */}
        <SectionShowcase title="Toast Notifications" icon="🔔" docs="docs/design-system.md#toast">
          <Card>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Text variant="label" size="xs" className="mb-3">Toast Component</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Props: message, icon, variant (success|warning|info|error|ember|ocean|sage|danger), duration (ms, 0 to disable), onDismiss
                  </Text>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="success" size="sm" onClick={() => setShowToast(true)}>
                      Show Toast
                    </Button>
                  </div>
                  {showToast && (
                    <div className="fixed bottom-4 right-4 z-50 max-w-md">
                      <Toast
                        variant="success"
                        onOpenChange={(open) => { if (!open) setShowToast(false); }}
                      >
                        Operation completed successfully!
                      </Toast>
                    </div>
                  )}
                  <div className="mt-4 space-y-3">
                    <Text variant="tertiary" size="sm">Toast variants with auto-dismiss and progress bar:</Text>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-sage-900/80 rounded-xl p-3 border border-sage-500/50 flex items-center gap-2">
                        <Text variant="sage" size="xs">✓ Success</Text>
                      </div>
                      <div className="bg-warning-900/80 rounded-xl p-3 border border-warning-500/50 flex items-center gap-2">
                        <Text variant="warning" size="xs">⚠️ Warning</Text>
                      </div>
                      <div className="bg-ocean-900/80 rounded-xl p-3 border border-ocean-500/50 flex items-center gap-2">
                        <Text variant="tertiary" size="xs">ℹ️ Info</Text>
                      </div>
                      <div className="bg-danger-900/80 rounded-xl p-3 border border-danger-500/50 flex items-center gap-2">
                        <Text variant="danger" size="xs">❌ Error</Text>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <PropTable props={componentDocs.Toast!.props} />
                  </div>
                  <AccessibilitySection
                    keyboard={componentDocs.Toast!.keyboard}
                    aria={componentDocs.Toast!.aria}
                    screenReader={componentDocs.Toast!.screenReader}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Loading States */}
        <SectionShowcase title="Loading States" icon="⏳" docs="docs/design-system.md#skeleton">
          <Card>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Text variant="label" size="xs" className="mb-3">Skeleton Component</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Animated skeleton loaders with shimmer effect. Use className for sizing (h-*, w-*).
                  </Text>
                  <div className="space-y-4">
                    <div>
                      <Text variant="tertiary" size="xs" className="mb-2">Basic Skeletons</Text>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                    <div>
                      <Text variant="tertiary" size="xs" className="mb-2">Card Skeleton</Text>
                      <Skeleton.Card className="p-6">
                        <Skeleton className="h-6 w-1/2 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                      </Skeleton.Card>
                    </div>
                    <div>
                      <Text variant="tertiary" size="xs" className="mb-2">Various Shapes</Text>
                      <div className="flex gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <Skeleton className="h-16 w-16 rounded-lg" />
                        <Skeleton className="h-16 flex-1 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Weather Icons */}
        <SectionShowcase title="Weather Icons" icon="🌤️" docs="app/components/weather/WeatherIcon.jsx">
          <Card>
            <CardContent>
              <div className="space-y-6">
                {/* Overview */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">WeatherIcon Component</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Maps WMO weather codes (0-99) to Lucide React icons. Supports day/night variants.
                    Props: code, isNight, size, className
                  </Text>
                </div>

                <CardDivider />

                {/* Clear and Clouds */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Clear Sky and Clouds</Text>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <WeatherIconDemo code={0} label="Sereno" />
                    <WeatherIconDemo code={1} label="Prevalentemente sereno" />
                    <WeatherIconDemo code={2} label="Parzialmente nuvoloso" />
                    <WeatherIconDemo code={3} label="Coperto" />
                  </div>
                </div>

                <CardDivider />

                {/* Day vs Night */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Day vs Night Variants</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Use isNight=true to show moon-based icons for clear/partly cloudy conditions
                  </Text>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <WeatherIconDemo code={0} label="Day - Clear" isNight={false} />
                    <WeatherIconDemo code={0} label="Night - Clear" isNight={true} />
                    <WeatherIconDemo code={2} label="Day - Partly cloudy" isNight={false} />
                    <WeatherIconDemo code={2} label="Night - Partly cloudy" isNight={true} />
                  </div>
                </div>

                <CardDivider />

                {/* Fog */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Fog</Text>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <WeatherIconDemo code={45} label="Nebbia" />
                    <WeatherIconDemo code={48} label="Nebbia con brina" />
                  </div>
                </div>

                <CardDivider />

                {/* Drizzle */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Drizzle (Pioviggine)</Text>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <WeatherIconDemo code={51} label="Pioviggine leggera" />
                    <WeatherIconDemo code={53} label="Pioviggine moderata" />
                    <WeatherIconDemo code={55} label="Pioviggine intensa" />
                    <WeatherIconDemo code={56} label="Pioviggine gelata" />
                  </div>
                </div>

                <CardDivider />

                {/* Rain */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Rain (Pioggia)</Text>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <WeatherIconDemo code={61} label="Pioggia leggera" />
                    <WeatherIconDemo code={63} label="Pioggia moderata" />
                    <WeatherIconDemo code={65} label="Pioggia intensa" />
                    <WeatherIconDemo code={66} label="Pioggia gelata" />
                  </div>
                </div>

                <CardDivider />

                {/* Snow */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Snow (Neve)</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    WMO codes 71-77, 85-86 map to CloudSnow icon
                  </Text>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <WeatherIconDemo code={71} label="Neve leggera" />
                    <WeatherIconDemo code={73} label="Neve moderata" />
                    <WeatherIconDemo code={75} label="Neve intensa" />
                    <WeatherIconDemo code={77} label="Granuli di neve" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <WeatherIconDemo code={85} label="Rovesci neve leggeri" />
                    <WeatherIconDemo code={86} label="Rovesci neve intensi" />
                  </div>
                </div>

                <CardDivider />

                {/* Showers */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Showers (Rovesci)</Text>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <WeatherIconDemo code={80} label="Rovesci leggeri" />
                    <WeatherIconDemo code={81} label="Rovesci moderati" />
                    <WeatherIconDemo code={82} label="Rovesci violenti" />
                  </div>
                </div>

                <CardDivider />

                {/* Thunderstorm */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Thunderstorm (Temporale)</Text>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <WeatherIconDemo code={95} label="Temporale" />
                    <WeatherIconDemo code={96} label="Temporale grandine" />
                    <WeatherIconDemo code={99} label="Temporale grandine forte" />
                  </div>
                </div>

                <CardDivider />

                {/* Sizes */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Icon Sizes</Text>
                  <div className="flex items-end gap-6">
                    <div className="flex flex-col items-center gap-2">
                      <WeatherIcon code={0} size={16} className="text-ocean-400" />
                      <Text variant="tertiary" size="xs">16px</Text>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <WeatherIcon code={0} size={24} className="text-ocean-400" />
                      <Text variant="tertiary" size="xs">24px</Text>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <WeatherIcon code={0} size={32} className="text-ocean-400" />
                      <Text variant="tertiary" size="xs">32px</Text>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <WeatherIcon code={0} size={48} className="text-ocean-400" />
                      <Text variant="tertiary" size="xs">48px</Text>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <WeatherIcon code={0} size={64} className="text-ocean-400" />
                      <Text variant="tertiary" size="xs">64px</Text>
                    </div>
                  </div>
                </div>

                <CardDivider />

                {/* WMO Code Reference */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">WMO Code Reference</Text>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700/30">
                          <th className="text-left py-2 px-3"><Text variant="tertiary" size="xs">Code</Text></th>
                          <th className="text-left py-2 px-3"><Text variant="tertiary" size="xs">Range</Text></th>
                          <th className="text-left py-2 px-3"><Text variant="tertiary" size="xs">Condition</Text></th>
                          <th className="text-left py-2 px-3"><Text variant="tertiary" size="xs">Icon</Text></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/20">
                        <tr><td className="py-2 px-3"><Text mono size="xs">0-3</Text></td><td className="py-2 px-3"><Text size="xs" variant="secondary">Clear to Overcast</Text></td><td className="py-2 px-3"><Text size="xs">Sereno → Coperto</Text></td><td className="py-2 px-3"><WeatherIcon code={0} size={16} className="text-warning-400" /></td></tr>
                        <tr><td className="py-2 px-3"><Text mono size="xs">45-48</Text></td><td className="py-2 px-3"><Text size="xs" variant="secondary">Fog</Text></td><td className="py-2 px-3"><Text size="xs">Nebbia</Text></td><td className="py-2 px-3"><WeatherIcon code={45} size={16} className="text-slate-400" /></td></tr>
                        <tr><td className="py-2 px-3"><Text mono size="xs">51-57</Text></td><td className="py-2 px-3"><Text size="xs" variant="secondary">Drizzle</Text></td><td className="py-2 px-3"><Text size="xs">Pioviggine</Text></td><td className="py-2 px-3"><WeatherIcon code={51} size={16} className="text-ocean-400" /></td></tr>
                        <tr><td className="py-2 px-3"><Text mono size="xs">61-67</Text></td><td className="py-2 px-3"><Text size="xs" variant="secondary">Rain</Text></td><td className="py-2 px-3"><Text size="xs">Pioggia</Text></td><td className="py-2 px-3"><WeatherIcon code={61} size={16} className="text-ocean-400" /></td></tr>
                        <tr><td className="py-2 px-3"><Text mono size="xs">71-77</Text></td><td className="py-2 px-3"><Text size="xs" variant="secondary">Snow</Text></td><td className="py-2 px-3"><Text size="xs">Neve</Text></td><td className="py-2 px-3"><WeatherIcon code={71} size={16} className="text-slate-200" /></td></tr>
                        <tr><td className="py-2 px-3"><Text mono size="xs">80-82</Text></td><td className="py-2 px-3"><Text size="xs" variant="secondary">Rain Showers</Text></td><td className="py-2 px-3"><Text size="xs">Rovesci</Text></td><td className="py-2 px-3"><WeatherIcon code={80} size={16} className="text-ocean-400" /></td></tr>
                        <tr><td className="py-2 px-3"><Text mono size="xs">85-86</Text></td><td className="py-2 px-3"><Text size="xs" variant="secondary">Snow Showers</Text></td><td className="py-2 px-3"><Text size="xs">Rovesci neve</Text></td><td className="py-2 px-3"><WeatherIcon code={85} size={16} className="text-slate-200" /></td></tr>
                        <tr><td className="py-2 px-3"><Text mono size="xs">95-99</Text></td><td className="py-2 px-3"><Text size="xs" variant="secondary">Thunderstorm</Text></td><td className="py-2 px-3"><Text size="xs">Temporale</Text></td><td className="py-2 px-3"><WeatherIcon code={95} size={16} className="text-warning-400" /></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <CardDivider />

                {/* Code Example */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Usage Example</Text>
                  <CodeBlock code={`import { WeatherIcon, getWeatherLabel } from '@/app/components/weather';

// Basic usage
<WeatherIcon code={71} size={32} className="text-ocean-400" />

// Night variant
<WeatherIcon code={0} isNight={true} size={24} />

// Get weather label
const label = getWeatherLabel(71); // "Neve leggera"`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Empty States */}
        <SectionShowcase title="Empty States" icon="📭" docs="docs/design-system.md#emptystate">
          <Card>
            <CardContent>
              <div className="space-y-6">
                {/* Basic Empty State */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">EmptyState Component</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Props: icon (emoji or component), title, description, action (button component), className
                  </Text>
                  <div className="space-y-6">
                    <EmptyState
                      icon="🏠"
                      title="Nessun dispositivo"
                      description="Aggiungi dispositivi smart per iniziare a controllarli da questa interfaccia."
                      action={<Button variant="ember" icon="➕">Aggiungi Dispositivo</Button>}
                    />

                    <CardDivider />

                    <EmptyState
                      icon="📋"
                      title="Nessun dato disponibile"
                      description="I dati verranno visualizzati qui una volta disponibili."
                    />

                    <CardDivider />

                    <EmptyState
                      icon="🔍"
                      title="Nessun risultato"
                      description="Prova a modificare i criteri di ricerca."
                      action={<Button variant="subtle" size="sm">Cancella Filtri</Button>}
                    />
                  </div>
                  <Text variant="tertiary" size="sm" className="mt-4">
                    Features: Centered layout, customizable icon (emoji or React component), optional action button
                  </Text>
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Dividers */}
        <SectionShowcase title="Dividers" icon="➖" docs="docs/design-system.md#divider">
          <Card>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <Text variant="label" size="xs" className="mb-3">Divider Variants</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Props: label, variant (solid|dashed|gradient), spacing (small|medium|large), orientation (horizontal|vertical)
                  </Text>
                  <div className="space-y-1">
                    <Text variant="tertiary" size="xs">Solid</Text>
                    <Divider variant="solid" spacing="small" />
                    <Text variant="tertiary" size="xs">Dashed</Text>
                    <Divider variant="dashed" spacing="small" />
                    <Text variant="tertiary" size="xs">Gradient</Text>
                    <Divider variant="gradient" spacing="small" />
                  </div>
                </div>

                <div>
                  <Text variant="label" size="xs" className="mb-3">Divider with Label</Text>
                  <Divider label="Settings" variant="gradient" spacing="medium" />
                  <Text variant="secondary">Content after divider with label</Text>
                </div>

                <div>
                  <Text variant="label" size="xs" className="mb-3">Spacing Options</Text>
                  <Text variant="tertiary" size="xs">Small (my-4)</Text>
                  <Divider spacing="small" />
                  <Text variant="tertiary" size="xs">Medium (my-6)</Text>
                  <Divider spacing="medium" />
                  <Text variant="tertiary" size="xs">Large (my-8)</Text>
                  <Divider spacing="large" />
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Spacing Scale */}
        <SectionShowcase title="Spacing Scale" icon="📏" docs="docs/design-system.md#spacing-scale">
          <Card>
            <CardContent>
              <div className="space-y-4">
                <Text variant="label" size="xs" className="mb-3">Tailwind 4px Base Unit + Custom</Text>
                <Text variant="tertiary" size="sm" className="mb-4">
                  Common: p-5 sm:p-6 (cards), space-y-4 (sections), gap-4 (grids)
                </Text>
                {[
                  { name: 'space-1', value: '4px', usage: '0.25rem' },
                  { name: 'space-2', value: '8px', usage: '0.5rem' },
                  { name: 'space-3', value: '12px', usage: '0.75rem' },
                  { name: 'space-4', value: '16px', usage: '1rem - sections' },
                  { name: 'space-5', value: '20px', usage: '1.25rem - card padding' },
                  { name: 'space-6', value: '24px', usage: '1.5rem - card padding sm' },
                  { name: 'space-8', value: '32px', usage: '2rem' },
                  { name: 'space-10', value: '40px', usage: '2.5rem' },
                ].map((space) => (
                  <div key={space.name} className="flex items-center gap-4">
                    <div className={`bg-ember-500/30 h-4 rounded`} style={{ width: space.value }} />
                    <Text variant="tertiary" size="sm" mono>{space.name} = {space.usage}</Text>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Border Radius */}
        <SectionShowcase title="Border Radius" icon="⭕" docs="docs/design-system.md#border-radius">
          <Card>
            <CardContent>
              <Text variant="label" size="xs" className="mb-4">Organic, Generous Curves</Text>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'rounded-lg', value: '12px', label: 'Inputs' },
                  { name: 'rounded-xl', value: '16px', label: 'Buttons' },
                  { name: 'rounded-2xl', value: '20px', label: 'Cards' },
                  { name: 'rounded-full', value: 'pill', label: 'Badges' },
                ].map((radius) => (
                  <div key={radius.name} className="flex flex-col items-center gap-3">
                    <div className={`w-20 h-20 bg-ember-500/30 border-2 border-ember-500/50 ${radius.name}`} />
                    <div className="text-center">
                      <Text variant="secondary" size="sm">{radius.label}</Text>
                      <Text variant="tertiary" size="xs" mono>{radius.value}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Shadows */}
        <SectionShowcase title="Shadow System" icon="🌑" docs="docs/design-system.md#shadows---ember-noir-depth-system">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-card">
                <CardContent>
                  <Text variant="label" size="xs" className="mb-2">Card Shadow</Text>
                  <Text variant="tertiary" size="sm">shadow-card - Default card depth</Text>
                </CardContent>
              </Card>
              <Card className="shadow-card-elevated">
                <CardContent>
                  <Text variant="label" size="xs" className="mb-2">Card Elevated</Text>
                  <Text variant="tertiary" size="sm">shadow-card-elevated - Floating cards</Text>
                </CardContent>
              </Card>
              <Card className="shadow-ember-glow-sm">
                <CardContent>
                  <Text variant="label" size="xs" className="mb-2">Ember Glow Small</Text>
                  <Text variant="tertiary" size="sm">shadow-ember-glow-sm - Subtle active state</Text>
                </CardContent>
              </Card>
              <Card className="shadow-ember-glow">
                <CardContent>
                  <Text variant="label" size="xs" className="mb-2">Ember Glow</Text>
                  <Text variant="tertiary" size="sm">shadow-ember-glow - Standard glow</Text>
                </CardContent>
              </Card>
              <Card className="shadow-ember-glow-lg">
                <CardContent>
                  <Text variant="label" size="xs" className="mb-2">Ember Glow Large</Text>
                  <Text variant="tertiary" size="sm">shadow-ember-glow-lg - Prominent glow</Text>
                </CardContent>
              </Card>
            </div>
          </div>
        </SectionShowcase>

        {/* Dialog Patterns */}
        <SectionShowcase title="Dialog Patterns" icon="💬" docs="app/components/ui/ConfirmationDialog.js">
          <Card>
            <CardContent>
              <div className="space-y-6">
                {/* ConfirmationDialog Component */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">ConfirmationDialog Component (v4.0)</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Radix-based confirmation dialog with smart focus management. Props: isOpen, onClose, onConfirm, title, description, confirmLabel, cancelLabel, variant (default|danger), loading
                  </Text>

                  <div className="space-y-4">
                    <div>
                      <Text variant="tertiary" size="xs" className="mb-2">Focus Management</Text>
                      <Text variant="secondary" size="sm" className="mb-3">
                        Default variant focuses Confirm button. Danger variant focuses Cancel button for safer UX.
                      </Text>
                      <div className="flex flex-wrap gap-3">
                        <Button variant="ember" onClick={() => setShowConfirmDefault(true)}>
                          Default Confirmation
                        </Button>
                        <Button variant="danger" onClick={() => setShowConfirmDanger(true)}>
                          Danger Confirmation
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Text variant="tertiary" size="xs" className="mb-2">Features</Text>
                      <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                        <li>Smart focus: Cancel for danger, Confirm for default</li>
                        <li>Loading state blocks ESC and backdrop click</li>
                        <li>Danger variant uses outline styling (not solid red)</li>
                        <li>Mobile bottom sheet mode (max-sm breakpoint)</li>
                        <li>Async onConfirm support with loading spinner</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <CardDivider />

                {/* FormModal Component */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">FormModal Component (v4.0)</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Modal with React Hook Form integration via render prop. Props: isOpen, onClose, onSubmit, title, description, validationSchema (Zod), defaultValues, submitLabel, cancelLabel, successMessage, size
                  </Text>

                  <div className="space-y-4">
                    <div>
                      <Text variant="tertiary" size="xs" className="mb-2">Validation Features</Text>
                      <Text variant="secondary" size="sm" className="mb-3">
                        Hybrid validation: onBlur for touched fields, summary on submit. Error display at top and inline.
                      </Text>
                      <Button variant="subtle" onClick={() => setShowFormModal(true)}>
                        Open Form Modal
                      </Button>
                    </div>

                    <div>
                      <Text variant="tertiary" size="xs" className="mb-2">Features</Text>
                      <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                        <li>Render prop pattern: {`{({ control, formState }) => ...}`}</li>
                        <li>Hybrid validation timing (onBlur + onChange after error)</li>
                        <li>Error summary at top + inline field errors</li>
                        <li>Shake animation on invalid fields during submit</li>
                        <li>Success checkmark overlay for 800ms before auto-close</li>
                        <li>Loading state with disabled fields and prevented close</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dialog Components */}
          <ConfirmationDialog
            isOpen={showConfirmDefault}
            onClose={() => setShowConfirmDefault(false)}
            onConfirm={handleConfirmDefault}
            title="Confirm Action"
            description="Are you sure you want to proceed with this action?"
            confirmLabel="Proceed"
            loading={isConfirmingDefault}
          />

          <ConfirmationDialog
            isOpen={showConfirmDanger}
            onClose={() => setShowConfirmDanger(false)}
            onConfirm={handleConfirmDanger}
            title="Delete Item?"
            description="This action cannot be undone. The item will be permanently removed."
            confirmLabel="Delete"
            variant="danger"
            loading={isConfirmingDanger}
          />

          <FormModal
            isOpen={showFormModal}
            onClose={() => setShowFormModal(false)}
            onSubmit={handleFormSubmit}
            title="Add New Item"
            description="Fill in the details below"
            validationSchema={demoFormSchema}
            defaultValues={{ name: '', email: '' }}
            successMessage="Item added successfully!"
          >
            {({ control }: { control: any }) => (
              <div className="space-y-4">
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Input
                      aria-label="Name"
                      placeholder="Enter name"
                      {...field}
                      error={fieldState.error?.message}
                      data-field="name"
                      autoComplete="off" data-lpignore="true" data-1p-ignore
                    />
                  )}
                />
                <Controller
                  name="email"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Input
                      aria-label="Email"
                      type="email"
                      placeholder="user@example.com"
                      {...field}
                      error={fieldState.error?.message}
                      data-field="email"
                      autoComplete="off" data-lpignore="true" data-1p-ignore
                    />
                  )}
                />
              </div>
            )}
          </FormModal>
        </SectionShowcase>

        {/* Data Table */}
        <SectionShowcase title="Data Table" icon="📊" docs="app/components/ui/DataTable.js">
          <Card>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Text variant="label" size="xs" className="mb-3">DataTable Component (v4.0)</Text>
                  <Text variant="tertiary" size="sm" className="mb-4">
                    Full-featured data table built on TanStack Table with sorting, filtering, pagination, selection, and row expansion. Supports roving tabindex keyboard navigation.
                  </Text>
                </div>

                <div>
                  <Text variant="tertiary" size="xs" className="mb-3">Basic Table</Text>
                  <DataTableDemo />
                </div>

                <CardDivider />

                <div>
                  <Text variant="tertiary" size="xs" className="mb-2">Features</Text>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                    <li>Sorting: Click column headers (three-state cycle: asc → desc → none)</li>
                    <li>Filtering: Global search + column-specific filters with removable chips</li>
                    <li>Pagination: Configurable page size with ellipsis algorithm (max 5 visible pages)</li>
                    <li>Selection: Checkbox column with bulk actions toolbar</li>
                    <li>Expansion: Click row to expand, custom content rendering</li>
                    <li>Responsive: Horizontal scroll with fade gradient indicator</li>
                    <li>Density: Compact (32px), Default (48px), Relaxed (64px) row heights</li>
                    <li>Keyboard: Roving tabindex (ArrowUp/Down, Enter to expand, Space to select)</li>
                  </ul>
                </div>

                <CardDivider />

                <div>
                  <Text variant="tertiary" size="xs" className="mb-3">Accessibility</Text>
                  <AccessibilitySection />
                </div>

                <CardDivider />

                <div>
                  <Text variant="tertiary" size="xs" className="mb-3">Props</Text>
                  <PropTable />
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Best Practices */}
        <SectionShowcase title="Critical Best Practices" icon="✅" docs="docs/design-system.md#usage-rules">
          <Card>
            <CardContent>
              <div className="space-y-4">
                <Banner
                  variant="success"
                  title="✅ ALWAYS Use UI Components"
                  description="NEVER use raw HTML (h1-h6, p, span, input). ALWAYS use Heading, Text, Input components."
                  compact
                />
                <Banner
                  variant="success"
                  title="✅ USE Variant Props"
                  description="Use variant='ember' NOT className='text-ember-400'. Components handle dark/light mode internally."
                  compact
                />
                <Banner
                  variant="success"
                  title="✅ className for Layout ONLY"
                  description="Use className ONLY for: spacing (mt-4, p-6), sizing (w-full), positioning (absolute), flex/grid (flex-col, gap-4). NEVER for colors or typography."
                  compact
                />
                <Banner
                  variant="warning"
                  title="⚠️ AVOID Triple Overrides"
                  description="WRONG: 'text-slate-800 [html:not(.dark)_&]:text-slate-800 text-slate-200'. RIGHT: 'text-slate-200 [html:not(.dark)_&]:text-slate-800'"
                  compact
                />
                <Banner
                  variant="warning"
                  title="⚠️ DON'T Mix dark: and [html:not(.dark)_&]:"
                  description="Use ONLY ONE pattern. Prefer dark-first: 'bg-slate-900 [html:not(.dark)_&]:bg-white'"
                  compact
                />
                <Banner
                  variant="ember"
                  title="🎨 Dark-First Philosophy"
                  description="Design for dark mode first, then add light mode overrides. Test both modes always."
                  compact
                />
              </div>
            </CardContent>
          </Card>
        </SectionShowcase>

        {/* Footer */}
        <Card variant="subtle" className="mt-12">
          <CardContent>
            <div className="text-center space-y-2">
              <Text variant="tertiary" size="sm">
                Complete technical documentation:{' '}
                <Text as="span" variant="tertiary">docs/design-system.md</Text>
              </Text>
              <Text variant="tertiary" size="xs">
                Ember Noir Design System v3.0 - Complete Phase 14-16 Components
              </Text>
              <Text variant="tertiary" size="xs">
                Last Updated: 2026-01-30
              </Text>
            </div>
          </CardContent>
        </Card>
        </div>
      </PageLayout>
  );
}

/**
 * DataTable Demo Component
 */
function DataTableDemo() {
  // Sample data
  const sampleData = useMemo(() => [
    { id: '1', name: 'Thermostat Living Room', type: 'thermostat', status: 'online', lastUpdate: new Date('2026-02-05T08:00:00Z') },
    { id: '2', name: 'Stove Main', type: 'stove', status: 'online', lastUpdate: new Date('2026-02-05T07:45:00Z') },
    { id: '3', name: 'Lights Bedroom', type: 'lights', status: 'offline', lastUpdate: new Date('2026-02-04T22:30:00Z') },
    { id: '4', name: 'Sensor Kitchen', type: 'sensor', status: 'online', lastUpdate: new Date('2026-02-05T08:05:00Z') },
    { id: '5', name: 'Camera Garage', type: 'camera', status: 'offline', lastUpdate: new Date('2026-02-03T15:20:00Z') },
  ], []);

  // Column definitions
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Device Name',
      cell: ({ getValue }: { getValue: () => string }) => (
        <Text>{getValue()}</Text>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ getValue }: { getValue: () => string }) => {
        const type = getValue();
        const variants: Record<string, 'ember' | 'ocean' | 'sage' | 'neutral'> = {
          thermostat: 'ember',
          stove: 'ember',
          lights: 'sage',
          sensor: 'ocean',
          camera: 'neutral',
        };
        return (
          <Badge variant={variants[type] || 'neutral'}>
            {type}
          </Badge>
        );
      },
      filterFn: 'equals',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }: { getValue: () => string }) => {
        const status = getValue();
        return (
          <Badge variant={status === 'online' ? 'sage' : 'neutral'}>
            {status}
          </Badge>
        );
      },
      filterFn: 'equals',
    },
    {
      accessorKey: 'lastUpdate',
      header: 'Last Update',
      cell: ({ getValue }: { getValue: () => string }) => {
        const date = new Date(getValue());
        return (
          <Text variant="secondary" size="sm">
            {date.toLocaleString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        );
      },
      sortingFn: 'datetime',
    },
  ], []);

  return (
    <DataTable
      data={sampleData}
      columns={columns}
      density="compact"
      enableFiltering
      enablePagination
      enableExpansion
      pageSize={5}
      showRowCount
      getRowId={(row: any) => row.id}
      renderExpandedContent={(row: any) => (
        <div className="p-4 space-y-2">
          <Text variant="secondary" size="sm">
            <strong>Device ID:</strong> {row.original.id}
          </Text>
          <Text variant="secondary" size="sm">
            <strong>Full Name:</strong> {row.original.name}
          </Text>
          <Text variant="secondary" size="sm">
            <strong>Type:</strong> {row.original.type}
          </Text>
        </div>
      )}
    />
  );
}

/**
 * Section wrapper with title and optional docs link (showcase-specific variant)
 */
function SectionShowcase({ title, icon, docs, children }: SectionShowcaseProps) {
  // Generate anchor ID from title (lowercase, replace spaces with dashes)
  const anchorId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <section id={anchorId} className="space-y-4 scroll-mt-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">{icon}</span>
          <Heading level={2} variant="gradient">{title}</Heading>
        </div>
        {docs && (
          <Text variant="tertiary" size="xs" mono className="hidden sm:block">
            {docs}
          </Text>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * Color swatch display with usage notes
 */
function ColorSwatch({ name, description, colors, usage }: ColorSwatchProps) {
  return (
    <Card variant="subtle">
      <CardContent>
        <Heading level={4} size="md" className="mb-2">{name}</Heading>
        <Text variant="tertiary" size="xs" className="mb-2">{description}</Text>
        <div className="flex gap-2 mb-3">
          {colors.map((color: string) => (
            <div
              key={color}
              className={`w-8 h-8 rounded-lg bg-${color} border border-white/10`}
              title={color}
            />
          ))}
        </div>
        <Text variant="tertiary" size="xs">
          Usage: {usage}
        </Text>
      </CardContent>
    </Card>
  );
}

/**
 * Weather icon demo with code and label
 */
function WeatherIconDemo({ code, label, isNight = false }: WeatherIconDemoProps) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-slate-800/40 rounded-xl [html:not(.dark)_&]:bg-slate-100/80">
      <WeatherIcon code={code} isNight={isNight} size={32} className="text-ocean-400" />
      <Text variant="tertiary" size="xs" className="text-center">{label}</Text>
      <Text mono size="xs" variant="secondary">WMO: {code}</Text>
    </div>
  );
}
