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
import BottomSheet from '@/app/components/ui/BottomSheet';
import { useState } from 'react';

/**
 * Design System Showcase Page - Ember Noir v2.3
 *
 * **IMPORTANT**: This page is the SINGLE SOURCE OF TRUTH for UI components.
 * Always reference this page when creating new pages or components.
 *
 * This page exactly mirrors the documentation in docs/design-system.md.
 * Any changes to the design system MUST be reflected in both places.
 *
 * @see docs/design-system.md for complete technical documentation
 */
export default function DesignSystemPage() {
  const [toggleState, setToggleState] = useState(false);
  const [selectValue, setSelectValue] = useState('1');
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [checkboxState, setCheckboxState] = useState(false);
  const [checkboxIndeterminate, setCheckboxIndeterminate] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 [html:not(.dark)_&]:from-slate-50 [html:not(.dark)_&]:via-white [html:not(.dark)_&]:to-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8 pb-24">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <Heading level={1} variant="gradient">
            Ember Noir Design System
          </Heading>
          <Text variant="secondary" size="lg" className="max-w-2xl mx-auto">
            A sophisticated dark-first design system with warm accents. Version 2.3.
          </Text>
          <Banner
            variant="ember"
            title="Reference Guide"
            description="This page mirrors docs/design-system.md exactly. Use this as your primary reference when building features."
            compact
          />
        </div>

        {/* Typography */}
        <Section title="Typography" icon="📝" docs="docs/design-system.md#typography">
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
                    <Heading level={4} variant="ocean">Heading 4 - Ocean (ocean-300/ocean-700)</Heading>
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
                    <Text variant="ember" weight="semibold">Ember Accent - Highlighted (ember-400/ember-600)</Text>
                    <Text variant="ocean" weight="semibold">Ocean Accent - Info (ocean-400/ocean-600)</Text>
                    <Text variant="sage" weight="semibold">Sage Accent - Success (sage-400/sage-600)</Text>
                    <Text variant="warning" weight="semibold">Warning Accent - Attention (warning-400/warning-600)</Text>
                    <Text variant="danger" weight="semibold">Danger Accent - Error (danger-400/danger-600)</Text>
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
        </Section>

        {/* Colors */}
        <Section title="Color Palette" icon="🎨" docs="docs/design-system.md#color-palette">
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
        </Section>

        {/* Buttons */}
        <Section title="Buttons" icon="🔘" docs="docs/design-system.md#button">
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
                    <Button variant="ocean">Ocean</Button>
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
                    <Button icon="🔥" variant="ember" iconOnly size="md" />
                    <ButtonIcon icon="⚙️" label="Settings" variant="ghost" />
                    <ButtonIcon icon="❌" label="Close" variant="danger" size="sm" />
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
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Cards */}
        <Section title="Cards" icon="🃏" docs="docs/design-system.md#card">
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
        </Section>

        {/* Banners */}
        <Section title="Banners" icon="📢" docs="docs/design-system.md#banner">
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
            <Text variant="warning" weight="semibold" size="sm" className="mt-4">
              ⚠️ CRITICAL: Always use description prop! Using children directly will NOT apply variant colors.
            </Text>
          </div>
        </Section>

        {/* Status Badges */}
        <Section title="Status Badges" icon="🏷️" docs="docs/design-system.md#statusbadge">
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
        </Section>

        {/* Form Inputs */}
        <Section title="Form Inputs" icon="📝" docs="docs/design-system.md#form-inputs">
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
                      label="Text Input"
                      placeholder="Enter text..."
                      icon="📧"
                    />
                    <Input
                      label="Password Input"
                      type="password"
                      placeholder="Enter password..."
                      icon="🔒"
                    />
                    <Input
                      label="Input with Variant"
                      placeholder="Ocean variant..."
                      icon="🌊"
                      variant="ocean"
                    />
                    <Input
                      label="Input with Helper Text"
                      placeholder="Enter text..."
                      helperText="This is helper text that provides additional context"
                    />
                    <Input
                      label="Input with Error"
                      placeholder="Enter text..."
                      error="This field is required"
                    />
                    <Input
                      label="Disabled Input"
                      placeholder="Disabled..."
                      disabled
                      value="Cannot edit"
                    />
                  </div>
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
                      onChange={(e) => setSelectValue(e.target.value)}
                    />
                    <Select
                      label="Select with Variant"
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
                      disabled
                      options={[
                        { value: '1', label: 'Cannot select' },
                      ]}
                      value="1"
                      onChange={() => {}}
                    />
                  </div>
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
                        onChange={setToggleState}
                        label="Default Toggle"
                      />
                      <Text variant="secondary" size="sm">Default (Ember) - Interactive</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={true}
                        onChange={() => {}}
                        label="Ocean Variant"
                        variant="ocean"
                      />
                      <Text variant="secondary" size="sm">Ocean Variant</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={true}
                        onChange={() => {}}
                        label="Sage Variant"
                        variant="sage"
                      />
                      <Text variant="secondary" size="sm">Sage Variant</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={false}
                        onChange={() => {}}
                        label="Small Size"
                        size="sm"
                      />
                      <Toggle
                        checked={false}
                        onChange={() => {}}
                        label="Medium Size"
                        size="md"
                      />
                      <Toggle
                        checked={false}
                        onChange={() => {}}
                        label="Large Size"
                        size="lg"
                      />
                      <Text variant="tertiary" size="xs" className="ml-2">Sizes: sm (h-6), md (h-8), lg (h-10)</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={false}
                        onChange={() => {}}
                        label="Disabled Toggle"
                        disabled
                      />
                      <Text variant="secondary" size="sm">Disabled State</Text>
                    </div>
                  </div>
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
                        onChange={(e) => setCheckboxState(e.target.checked)}
                        label="Interactive Checkbox"
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
                          label="Primary"
                          variant="primary"
                        />
                        <Checkbox
                          id="checkbox-ocean"
                          checked={true}
                          onChange={() => {}}
                          label="Ocean"
                          variant="ocean"
                        />
                        <Checkbox
                          id="checkbox-sage"
                          checked={true}
                          onChange={() => {}}
                          label="Sage"
                          variant="sage"
                        />
                        <Checkbox
                          id="checkbox-ember"
                          checked={true}
                          onChange={() => {}}
                          label="Ember"
                          variant="ember"
                        />
                        <Checkbox
                          id="checkbox-flame"
                          checked={true}
                          onChange={() => {}}
                          label="Flame"
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
                          label="Small"
                          size="sm"
                        />
                        <Checkbox
                          id="checkbox-md"
                          checked={true}
                          onChange={() => {}}
                          label="Medium"
                          size="md"
                        />
                        <Checkbox
                          id="checkbox-lg"
                          checked={true}
                          onChange={() => {}}
                          label="Large"
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
                          label="Checked"
                        />
                        <Checkbox
                          id="checkbox-unchecked"
                          checked={false}
                          onChange={() => {}}
                          label="Unchecked"
                        />
                        <Checkbox
                          id="checkbox-indeterminate"
                          indeterminate={checkboxIndeterminate}
                          onChange={() => setCheckboxIndeterminate(!checkboxIndeterminate)}
                          label="Indeterminate"
                        />
                        <Checkbox
                          id="checkbox-disabled"
                          checked={false}
                          onChange={() => {}}
                          label="Disabled"
                          disabled
                        />
                        <Checkbox
                          id="checkbox-disabled-checked"
                          checked={true}
                          onChange={() => {}}
                          label="Disabled Checked"
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Progress Bar */}
        <Section title="Progress Bar" icon="📊" docs="docs/design-system.md#progressbar">
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
                    <ProgressBar value={75} variant="ember" label="Ember Progress" />
                    <ProgressBar value={60} variant="ocean" label="Ocean Progress" />
                    <ProgressBar value={85} variant="sage" label="Sage Progress" />
                    <ProgressBar value={40} variant="warning" label="Warning Progress" />
                    <ProgressBar value={25} variant="danger" label="Danger Progress" />
                  </div>
                </div>

                <CardDivider />

                {/* Sizes */}
                <div>
                  <Text variant="label" size="xs" className="mb-3">Sizes</Text>
                  <div className="space-y-4">
                    <ProgressBar value={65} size="sm" variant="ember" label="Small (h-2)" />
                    <ProgressBar value={65} size="md" variant="ember" label="Medium (h-3)" />
                    <ProgressBar value={65} size="lg" variant="ember" label="Large (h-4)" />
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
                      leftContent={<Text variant="ember" weight="semibold" size="sm">🔥 Power</Text>}
                      rightContent={<Text variant="secondary" size="sm" weight="bold">80%</Text>}
                    />
                    <ProgressBar
                      value={45}
                      variant="ocean"
                      leftContent={<Text variant="ocean" weight="semibold" size="sm">💨 Fan</Text>}
                      rightContent={<Text variant="secondary" size="sm" weight="bold">45%</Text>}
                    />
                    <ProgressBar
                      value={92}
                      variant="warning"
                      leftContent={<Text variant="warning" weight="semibold" size="sm">⏱️ Maintenance</Text>}
                      rightContent={<Text variant="warning" size="sm" weight="bold">92h / 100h</Text>}
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
                  <ProgressBar value={70} variant="sage" animated label="Animated Progress" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Modal & Overlays */}
        <Section title="Modal & Overlays" icon="🪟" docs="docs/design-system.md#modal">
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
                  <Button variant="ocean" onClick={() => setShowBottomSheet(true)}>
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
        </Section>

        {/* Toast Notifications */}
        <Section title="Toast Notifications" icon="🔔" docs="docs/design-system.md#toast">
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
                        message="Operation completed successfully!"
                        variant="success"
                        duration={5000}
                        onDismiss={() => setShowToast(false)}
                      />
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
                        <Text variant="ocean" size="xs">ℹ️ Info</Text>
                      </div>
                      <div className="bg-danger-900/80 rounded-xl p-3 border border-danger-500/50 flex items-center gap-2">
                        <Text variant="danger" size="xs">❌ Error</Text>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Loading States */}
        <Section title="Loading States" icon="⏳" docs="docs/design-system.md#skeleton">
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
        </Section>

        {/* Empty States */}
        <Section title="Empty States" icon="📭" docs="docs/design-system.md#emptystate">
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
        </Section>

        {/* Dividers */}
        <Section title="Dividers" icon="➖" docs="docs/design-system.md#divider">
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
        </Section>

        {/* Spacing Scale */}
        <Section title="Spacing Scale" icon="📏" docs="docs/design-system.md#spacing-scale">
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
        </Section>

        {/* Border Radius */}
        <Section title="Border Radius" icon="⭕" docs="docs/design-system.md#border-radius">
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
        </Section>

        {/* Shadows */}
        <Section title="Shadow System" icon="🌑" docs="docs/design-system.md#shadows---ember-noir-depth-system">
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
        </Section>

        {/* Best Practices */}
        <Section title="Critical Best Practices" icon="✅" docs="docs/design-system.md#usage-rules">
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
        </Section>

        {/* Footer */}
        <Card variant="subtle" className="mt-12">
          <CardContent>
            <div className="text-center space-y-2">
              <Text variant="tertiary" size="sm">
                Complete technical documentation:{' '}
                <Text as="span" variant="ocean" weight="semibold">docs/design-system.md</Text>
              </Text>
              <Text variant="tertiary" size="xs">
                Ember Noir Design System v2.3 - Complete Dark Mode Unification + Form Inputs
              </Text>
              <Text variant="tertiary" size="xs">
                Last Updated: 2026-01-16
              </Text>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Section wrapper with title and optional docs link
 */
function Section({ title, icon, docs, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <Heading level={2} variant="gradient">{title}</Heading>
        </div>
        {docs && (
          <Text variant="ocean" size="xs" mono className="hidden sm:block">
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
function ColorSwatch({ name, description, colors, usage }) {
  return (
    <Card variant="subtle">
      <CardContent>
        <Heading level={4} size="md" className="mb-2">{name}</Heading>
        <Text variant="tertiary" size="xs" className="mb-2">{description}</Text>
        <div className="flex gap-2 mb-3">
          {colors.map((color) => (
            <div
              key={color}
              className={`w-8 h-8 rounded-lg bg-${color} border border-white/10`}
              title={color}
            />
          ))}
        </div>
        <Text variant="tertiary" size="xs" weight="medium">
          Usage: {usage}
        </Text>
      </CardContent>
    </Card>
  );
}
