import type { Meta, StoryObj } from "@storybook/nextjs";

import { LocalizedLink } from "./localized-link";

const meta = {
  title: "Shared/UI/LocalizedLink",
  component: LocalizedLink,
  tags: ["autodocs"],
  args: {
    href: "/sessions",
    children: "Перейти к сессиям",
  },
} satisfies Meta<typeof LocalizedLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
