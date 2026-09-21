import type { Meta, StoryObj } from "@storybook/nextjs";

import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

const meta = {
  title: "Shared/UI/Card",
  component: Card,
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Алексей Петров</CardTitle>
        <CardDescription>Frontend-разработчик, 4 года опыта</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Badge variant="success">Свободен</Badge>
        <Badge variant="outline">React</Badge>
        <Badge variant="outline">TypeScript</Badge>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Пригласить на сессию</Button>
      </CardFooter>
    </Card>
  ),
};

export const HeaderOnly: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Заголовок карточки</CardTitle>
        <CardDescription>Пояснительный текст под заголовком.</CardDescription>
      </CardHeader>
    </Card>
  ),
};
