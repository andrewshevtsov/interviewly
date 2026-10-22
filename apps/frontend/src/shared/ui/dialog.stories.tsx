import type { Meta, StoryObj } from "@storybook/nextjs";

import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = {
  title: "Shared/UI/Dialog",
  component: Dialog,
  tags: ["autodocs"],
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Откликнуться</Button>
      </DialogTrigger>
      <DialogContent closeLabel="Закрыть">
        <DialogHeader>
          <DialogTitle>Откликнуться на карточку</DialogTitle>
          <DialogDescription>Выберите свою роль и время встречи.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Отмена</Button>
          <Button>Отправить отклик</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const OpenByDefault: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogContent closeLabel="Закрыть">
        <DialogHeader>
          <DialogTitle>Отклонить отклик</DialogTitle>
          <DialogDescription>Объясните причину: откликнувшийся её увидит.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
};
