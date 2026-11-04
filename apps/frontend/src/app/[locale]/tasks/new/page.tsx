import { CreateTaskPage } from "@/views/create-task-page";
import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";

/**
 * Страница создания новой задачи.
 * @returns {import("react").ReactNode} Форма в общей оболочке приложения.
 */
export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <CreateTaskPage />
      <Footer />
    </div>
  );
}
