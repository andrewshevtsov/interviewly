import type { Meta, StoryObj } from "@storybook/nextjs";

import { SectionLabel } from "./section-label";

const meta = {
  title: "Shared/UI/SectionLabel",
  component: SectionLabel,
  tags: ["autodocs"],
  args: { children: "участники" },
} satisfies Meta<typeof SectionLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Accent: Story = { args: { className: "text-primary" } };
