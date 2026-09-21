import type { Meta, StoryObj } from "@storybook/nextjs";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const meta = {
  title: "Shared/UI/Avatar",
  component: Avatar,
  tags: ["autodocs"],
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/80?img=12" alt="Алексей Петров" />
      <AvatarFallback>АП</AvatarFallback>
    </Avatar>
  ),
};

export const FallbackOnly: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="" alt="" />
      <AvatarFallback>АП</AvatarFallback>
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar className="h-8 w-8">
        <AvatarFallback>АП</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>АП</AvatarFallback>
      </Avatar>
      <Avatar className="h-16 w-16">
        <AvatarFallback className="text-lg">АП</AvatarFallback>
      </Avatar>
    </div>
  ),
};
