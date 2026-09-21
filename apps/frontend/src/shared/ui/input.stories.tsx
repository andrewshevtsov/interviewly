import type { Meta, StoryObj } from "@storybook/nextjs";

import { Input } from "./input";

const meta = {
  title: "Shared/UI/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    placeholder: "you@example.com",
    disabled: false,
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = { args: { defaultValue: "andrew@interviewly.dev" } };

export const Disabled: Story = { args: { disabled: true, defaultValue: "andrew@interviewly.dev" } };
