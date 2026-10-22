import type { Meta, StoryObj } from "@storybook/nextjs";

import { Card } from "./card";
import { ComingSoon } from "./coming-soon";

const meta = {
  title: "Shared/UI/ComingSoon",
  component: ComingSoon,
  tags: ["autodocs"],
  args: {
    label: "в разработке",
    children: (
      <Card className="p-5">
        <p className="font-semibold">AI-резюме</p>
        <p className="mt-2 text-sm text-muted-foreground">Уверенно объяснил решение, стоит подтянуть крайние случаи</p>
      </Card>
    ),
  },
} satisfies Meta<typeof ComingSoon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
