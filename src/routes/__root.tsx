import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { ThemeProvider } from "@/lib/theme";
import { BottomNav } from "@/components/BottomNav";
import { SocialProof } from "@/components/SocialProof";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { AIChatWidget } from "@/components/AIChatWidget";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">الصفحة غير موجودة</h2>
        <a
          href="/"
          className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold">حدث خطأ ما</h1>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { name: "theme-color", content: "#2E7D46" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "متجر الجزائر" },
      { name: "mobile-web-app-capable", content: "yes" },
      { title: "تسوق | Tasawa9 — تسوق أونلاين مع الدفع عند الاستلام" },
      {
        name: "description",
        content: "متجر إلكتروني جزائري: تصفح المنتجات واطلب الدفع عند الاستلام مع توصيل لجميع 58 ولاية.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "تسوق | Tasawa9 — تسوق أونلاين مع الدفع عند الاستلام" },
      { property: "og:description", content: "متجر إلكتروني جزائري: تصفح المنتجات واطلب الدفع عند الاستلام مع توصيل لجميع 58 ولاية." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "تسوق | Tasawa9 — تسوق أونلاين مع الدفع عند الاستلام" },
      { name: "twitter:description", content: "متجر إلكتروني جزائري: تصفح المنتجات واطلب الدفع عند الاستلام مع توصيل لجميع 58 ولاية." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/76YYBFuakbhQHaoRFZmp7TEoom92/social-images/social-1784970159775-7063.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/76YYBFuakbhQHaoRFZmp7TEoom92/social-images/social-1784970159775-7063.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CartProvider>
          <div className="mx-auto max-w-md lg:max-w-7xl min-h-dvh bg-background pb-20">
            <Outlet />
          </div>
          <BottomNav />
          <WhatsAppFab />
          <AIChatWidget />
          <PWAInstallBanner />
          <SocialProof />
          <Toaster position="top-center" richColors closeButton />
        </CartProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
