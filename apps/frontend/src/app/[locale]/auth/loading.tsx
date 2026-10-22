import { Loader2 } from "lucide-react";

import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";

/**
 * Заглушка, пока грузится страница входа: Next.js показывает её сразу после клика, не дожидаясь
 * ответа сервера. Навбар и футер те же, что у страницы, при подмене шапка не моргает.
 * @returns {import('react').ReactNode} Рамка страницы входа со спиннером вместо формы
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-start justify-center px-6 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      </main>

      <Footer />
    </div>
  );
}
