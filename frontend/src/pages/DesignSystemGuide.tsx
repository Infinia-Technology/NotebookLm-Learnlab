import { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  Card,
  CardHeader,
  Badge,
  Avatar,
  AvatarGroup,
  Alert,
  Spinner,
  Tooltip,
  Modal,
  ModalFooter,
  Tabs,
  TabList,
  Tab,
  TabPanel,
} from '../components/ui';
import { Copy, Check, ExternalLink } from 'lucide-react';

export function DesignSystemGuide() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Design System</h1>
              <p className="text-sm text-gray-500">Component library and usage guide</p>
            </div>
            <Badge variant="primary">v1.0</Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-12">
          {/* Introduction */}
          <section>
            <Alert variant="info" title="Welcome to the Design System">
              This page showcases all available UI components. Use these components to build consistent, accessible interfaces.
            </Alert>
          </section>

          {/* Buttons */}
          <ComponentSection
            title="Button"
            description="Buttons trigger actions or navigate to new pages."
            importCode="import { Button } from '@/components/ui';"
          >
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Variants</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Sizes</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">States</h4>
                <div className="flex flex-wrap gap-3">
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>
            </div>
          </ComponentSection>

          {/* Input */}
          <ComponentSection
            title="Input"
            description="Text inputs for forms and data entry."
            importCode="import { Input } from '@/components/ui';"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <Input label="Default" placeholder="Enter text..." />
              <Input label="With Helper" placeholder="Enter email..." helperText="We'll never share your email" />
              <Input label="With Error" placeholder="Enter value..." error="This field is required" />
              <Input label="Disabled" placeholder="Cannot edit..." disabled />
            </div>
          </ComponentSection>

          {/* Textarea */}
          <ComponentSection
            title="Textarea"
            description="Multi-line text input for longer content."
            importCode="import { Textarea } from '@/components/ui';"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <Textarea label="Message" placeholder="Type your message..." />
              <Textarea label="With Error" placeholder="Required field..." error="Please enter a message" />
            </div>
          </ComponentSection>

          {/* Select */}
          <ComponentSection
            title="Select"
            description="Dropdown for selecting from predefined options."
            importCode="import { Select } from '@/components/ui';"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <Select
                label="Country"
                placeholder="Select a country"
                options={[
                  { value: 'us', label: 'United States' },
                  { value: 'uk', label: 'United Kingdom' },
                  { value: 'ca', label: 'Canada' },
                  { value: 'au', label: 'Australia' },
                ]}
              />
              <Select
                label="With Error"
                placeholder="Select an option"
                error="Please select an option"
                options={[
                  { value: '1', label: 'Option 1' },
                  { value: '2', label: 'Option 2' },
                ]}
              />
            </div>
          </ComponentSection>

          {/* Checkbox, Radio, Switch */}
          <ComponentSection
            title="Checkbox, Radio & Switch"
            description="Selection controls for forms."
            importCode="import { Checkbox, Radio, RadioGroup, Switch } from '@/components/ui';"
          >
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Checkbox</h4>
                <div className="space-y-3">
                  <CheckboxDemo />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Radio</h4>
                <RadioDemo />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Switch</h4>
                <div className="space-y-3">
                  <SwitchDemo />
                </div>
              </div>
            </div>
          </ComponentSection>

          {/* Card */}
          <ComponentSection
            title="Card"
            description="Container for grouping related content."
            importCode="import { Card, CardHeader } from '@/components/ui';"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader title="Card Title" subtitle="Optional subtitle" />
                <p className="text-gray-600">This is the card content. Cards can contain any content.</p>
              </Card>
              <Card className="p-8 text-center">
                <p className="text-gray-600">Simple card without header</p>
              </Card>
            </div>
          </ComponentSection>

          {/* Badge */}
          <ComponentSection
            title="Badge"
            description="Small status indicators and labels."
            importCode="import { Badge } from '@/components/ui';"
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Variants</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Sizes</h4>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge size="sm">Small</Badge>
                  <Badge size="md">Medium</Badge>
                </div>
              </div>
            </div>
          </ComponentSection>

          {/* Avatar */}
          <ComponentSection
            title="Avatar"
            description="User profile images and initials."
            importCode="import { Avatar, AvatarGroup } from '@/components/ui';"
          >
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Sizes</h4>
                <div className="flex items-center gap-3">
                  <Avatar name="John Doe" size="xs" />
                  <Avatar name="John Doe" size="sm" />
                  <Avatar name="John Doe" size="md" />
                  <Avatar name="John Doe" size="lg" />
                  <Avatar name="John Doe" size="xl" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">With Initials</h4>
                <div className="flex items-center gap-3">
                  <Avatar name="Alice Brown" />
                  <Avatar name="Bob Wilson" />
                  <Avatar name="Carol Davis" />
                  <Avatar name="David Miller" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Avatar Group</h4>
                <AvatarGroup max={4}>
                  <Avatar name="User 1" />
                  <Avatar name="User 2" />
                  <Avatar name="User 3" />
                  <Avatar name="User 4" />
                  <Avatar name="User 5" />
                  <Avatar name="User 6" />
                </AvatarGroup>
              </div>
            </div>
          </ComponentSection>

          {/* Alert */}
          <ComponentSection
            title="Alert"
            description="Contextual feedback messages."
            importCode="import { Alert } from '@/components/ui';"
          >
            <div className="space-y-4">
              <Alert variant="info" title="Information">
                This is an informational message.
              </Alert>
              <Alert variant="success" title="Success">
                Your changes have been saved successfully.
              </Alert>
              <Alert variant="warning" title="Warning">
                Please review before proceeding.
              </Alert>
              <Alert variant="error" title="Error">
                Something went wrong. Please try again.
              </Alert>
              <Alert variant="info" onClose={() => {}}>
                This alert can be dismissed.
              </Alert>
            </div>
          </ComponentSection>

          {/* Spinner */}
          <ComponentSection
            title="Spinner"
            description="Loading indicators."
            importCode="import { Spinner } from '@/components/ui';"
          >
            <div className="flex items-center gap-6">
              <div className="text-center">
                <Spinner size="sm" />
                <p className="text-xs text-gray-500 mt-2">Small</p>
              </div>
              <div className="text-center">
                <Spinner size="md" />
                <p className="text-xs text-gray-500 mt-2">Medium</p>
              </div>
              <div className="text-center">
                <Spinner size="lg" />
                <p className="text-xs text-gray-500 mt-2">Large</p>
              </div>
            </div>
          </ComponentSection>

          {/* Tooltip */}
          <ComponentSection
            title="Tooltip"
            description="Additional information on hover."
            importCode="import { Tooltip } from '@/components/ui';"
          >
            <div className="flex flex-wrap gap-4">
              <Tooltip content="Top tooltip" position="top">
                <Button variant="outline" size="sm">Top</Button>
              </Tooltip>
              <Tooltip content="Bottom tooltip" position="bottom">
                <Button variant="outline" size="sm">Bottom</Button>
              </Tooltip>
              <Tooltip content="Left tooltip" position="left">
                <Button variant="outline" size="sm">Left</Button>
              </Tooltip>
              <Tooltip content="Right tooltip" position="right">
                <Button variant="outline" size="sm">Right</Button>
              </Tooltip>
            </div>
          </ComponentSection>

          {/* Modal */}
          <ComponentSection
            title="Modal"
            description="Dialog windows for focused interactions."
            importCode="import { Modal, ModalFooter } from '@/components/ui';"
          >
            <ModalDemo />
          </ComponentSection>

          {/* Tabs */}
          <ComponentSection
            title="Tabs"
            description="Organize content into tabbed sections."
            importCode="import { Tabs, TabList, Tab, TabPanel } from '@/components/ui';"
          >
            <Tabs defaultTab="tab1">
              <TabList>
                <Tab id="tab1">Account</Tab>
                <Tab id="tab2">Notifications</Tab>
                <Tab id="tab3">Security</Tab>
                <Tab id="tab4" disabled>Disabled</Tab>
              </TabList>
              <TabPanel id="tab1">
                <Card>
                  <p className="text-gray-600">Account settings content goes here.</p>
                </Card>
              </TabPanel>
              <TabPanel id="tab2">
                <Card>
                  <p className="text-gray-600">Notification preferences content goes here.</p>
                </Card>
              </TabPanel>
              <TabPanel id="tab3">
                <Card>
                  <p className="text-gray-600">Security settings content goes here.</p>
                </Card>
              </TabPanel>
            </Tabs>
          </ComponentSection>

          {/* Color Palette */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Color Palette</h2>
            <p className="text-gray-600 mb-6">Design system color tokens</p>
            <Card>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Primary</h4>
                  <div className="space-y-2">
                    <ColorSwatch name="--btn-primary-bg" label="Primary" />
                    <ColorSwatch name="--btn-primary-hover" label="Primary Hover" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Semantic</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-green-500" />
                      <span className="text-sm text-gray-600">Success</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-amber-500" />
                      <span className="text-sm text-gray-600">Warning</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-red-500" />
                      <span className="text-sm text-gray-600">Danger</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-500" />
                      <span className="text-sm text-gray-600">Info</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Typography */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Typography</h2>
            <p className="text-gray-600 mb-6">Text styles and hierarchy</p>
            <Card>
              <div className="space-y-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Heading 1</h1>
                  <p className="text-sm text-gray-500">text-4xl font-bold</p>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Heading 2</h2>
                  <p className="text-sm text-gray-500">text-3xl font-bold</p>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Heading 3</h3>
                  <p className="text-sm text-gray-500">text-2xl font-semibold</p>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Heading 4</h4>
                  <p className="text-sm text-gray-500">text-xl font-semibold</p>
                </div>
                <div>
                  <p className="text-base text-gray-900">Body text - The quick brown fox jumps over the lazy dog.</p>
                  <p className="text-sm text-gray-500">text-base</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Small text - The quick brown fox jumps over the lazy dog.</p>
                  <p className="text-sm text-gray-500">text-sm text-gray-600</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Spacing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Spacing</h2>
            <p className="text-gray-600 mb-6">Consistent spacing scale</p>
            <Card>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((space) => (
                  <div key={space} className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 w-12">space-{space}</span>
                    <div
                      className="h-4 bg-[var(--btn-primary-bg)]/20 rounded"
                      style={{ width: `${space * 0.25}rem` }}
                    />
                    <span className="text-sm text-gray-400">{space * 4}px</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
          Design System Guide - Built with Tailwind CSS v4
        </div>
      </footer>
    </div>
  );
}

// Helper Components

function ComponentSection({
  title,
  description,
  importCode,
  children,
}: {
  title: string;
  description: string;
  importCode: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const copyImport = () => {
    navigator.clipboard.writeText(importCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
      <Card>
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg mb-6 -mx-2 -mt-2">
          <code className="text-sm text-gray-700">{importCode}</code>
          <button
            onClick={copyImport}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        {children}
      </Card>
    </section>
  );
}

function ColorSwatch({ name, label }: { name: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded"
        style={{ backgroundColor: `var(${name})` }}
      />
      <div>
        <span className="text-sm text-gray-600">{label}</span>
        <code className="block text-xs text-gray-400">{name}</code>
      </div>
    </div>
  );
}

function CheckboxDemo() {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(true);

  return (
    <>
      <Checkbox
        label="Accept terms"
        checked={checked1}
        onChange={(e) => setChecked1(e.target.checked)}
      />
      <Checkbox
        label="Checked"
        checked={checked2}
        onChange={(e) => setChecked2(e.target.checked)}
      />
      <Checkbox label="Disabled" disabled />
      <Checkbox
        label="With description"
        description="Additional context about this option"
        checked={false}
        onChange={() => {}}
      />
    </>
  );
}

function RadioDemo() {
  const [value, setValue] = useState('option1');

  return (
    <RadioGroup label="">
      <Radio
        name="demo"
        label="Option 1"
        value="option1"
        checked={value === 'option1'}
        onChange={() => setValue('option1')}
      />
      <Radio
        name="demo"
        label="Option 2"
        value="option2"
        checked={value === 'option2'}
        onChange={() => setValue('option2')}
      />
      <Radio
        name="demo"
        label="Option 3"
        value="option3"
        checked={value === 'option3'}
        onChange={() => setValue('option3')}
      />
    </RadioGroup>
  );
}

function SwitchDemo() {
  const [enabled1, setEnabled1] = useState(false);
  const [enabled2, setEnabled2] = useState(true);

  return (
    <>
      <Switch
        label="Notifications"
        checked={enabled1}
        onChange={(e) => setEnabled1(e.target.checked)}
      />
      <Switch
        label="Dark mode"
        checked={enabled2}
        onChange={(e) => setEnabled2(e.target.checked)}
      />
      <Switch
        label="With description"
        description="Enable this feature"
        checked={false}
        onChange={() => {}}
      />
    </>
  );
}

function ModalDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        onClick={() => {
          setSize('sm');
          setIsOpen(true);
        }}
      >
        Small Modal
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          setSize('md');
          setIsOpen(true);
        }}
      >
        Medium Modal
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          setSize('lg');
          setIsOpen(true);
        }}
      >
        Large Modal
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Title"
        description="This is a description of what this modal does."
        size={size}
      >
        <p className="text-gray-600">
          This is the modal content. You can put any content here including forms,
          images, or other components.
        </p>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setIsOpen(false)}>
            Confirm
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
