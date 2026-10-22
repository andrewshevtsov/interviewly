import type { Meta, StoryObj } from "@storybook/nextjs";

import { Checkbox } from "./checkbox";

const meta = {
  title: "Shared/UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: { disabled: false },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };

export const Disabled: Story = { args: { disabled: true } };
