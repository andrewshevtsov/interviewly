import { EditTaskPage } from "@/views/edit-task-page";
import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";

/** Свойства динамической страницы редактирования. */
interface EditTaskRoutePageProps {
  /** Параметры сегментов route. */
  params: Promise<{
    /** Идентификатор задачи. */
    id: string;
  }>;
}

/**
 * Страница редактирования задачи администратором.
 * @param {EditTaskRoutePageProps} props - Динамические параметры route.
 * @param {Promise<{id: string}>} props.params - Идентификатор задачи.
 * @returns {Promise<import("react").ReactNode>} Форма в общей оболочке приложения.
 */
export default async function Page(props: EditTaskRoutePageProps) {
  const { id } = await props.params;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <EditTaskPage taskId={id} />
      <Footer />
    </div>
  );
}
