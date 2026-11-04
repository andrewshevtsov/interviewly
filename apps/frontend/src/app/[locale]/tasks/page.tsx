import { TaskBankPage } from "@/views/task-bank-page";
import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";

/**
 * Страница банка задач.
 * @returns {import("react").ReactNode} Экран банка задач.
 */
export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <TaskBankPage />
      <Footer />
    </div>
  );
}
