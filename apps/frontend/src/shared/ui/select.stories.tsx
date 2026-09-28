import type { Meta, StoryObj } from "@storybook/nextjs";

import { Select } from "./select";

const meta = {
  title: "Shared/UI/Select",
  component: Select,
  tags: ["autodocs"],
  args: {
    disabled: false,
    defaultValue: "",
    children: (
      <>
        <option value="" disabled>
          Выберите участника…
        </option>
        <option value="owner">Olivia Owner</option>
        <option value="candidate">Clara Candidate</option>
      </>
    ),
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = { args: { defaultValue: "candidate" } };

export const Disabled: Story = { args: { disabled: true } };
