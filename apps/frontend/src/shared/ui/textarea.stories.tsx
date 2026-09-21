import type { Meta, StoryObj } from "@storybook/nextjs";

import { Textarea } from "./textarea";

const meta = {
  title: "Shared/UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: {
    placeholder: "Расскажите о себе",
    disabled: false,
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = { args: { defaultValue: "Люблю React и TypeScript." } };

export const Disabled: Story = { args: { disabled: true } };
