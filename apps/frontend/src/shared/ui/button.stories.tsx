import type { Meta, StoryObj } from "@storybook/nextjs";

import { Button } from "./button";

const meta = {
  title: "Shared/UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "outline", "ghost", "link", "destructive"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
  },
  args: {
    children: "Создать сессию",
    disabled: false,
    isLoading: false,
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = { args: { variant: "secondary" } };

export const Outline: Story = { args: { variant: "outline" } };

export const Ghost: Story = { args: { variant: "ghost" } };

export const Link: Story = { args: { variant: "link" } };

export const Destructive: Story = { args: { variant: "destructive", children: "Удалить" } };

export const Disabled: Story = { args: { disabled: true } };

export const Loading: Story = { args: { isLoading: true, children: "Создаём…" } };

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Иконка">
        →
      </Button>
    </div>
  ),
};
