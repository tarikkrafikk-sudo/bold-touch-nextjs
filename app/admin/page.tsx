import Header from "@/components/Header";
import TopBanner from "@/components/TopBanner";
import Footer from "@/components/Footer";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { isAdminAuthed } from "@/lib/auth";
import { getProducts } from "@/lib/products-store";
import { getRealisations } from "@/lib/realisations-store";
import { getRequests } from "@/lib/requests-store";
import { getReviews } from "@/lib/reviews-store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = isAdminAuthed();
  const initialRequests = authed ? await getRequests() : [];
  const initialReviews = authed ? await getReviews() : [];

  return (
    <>
      <TopBanner />
      <Header />
      <main className="min-h-[60vh] bg-cream">
        {authed ? (
          <AdminDashboard
            initialProducts={getProducts()}
            initialRealisations={getRealisations()}
            initialRequests={initialRequests}
            initialReviews={initialReviews}
          />
        ) : (
          <AdminLogin />
        )}
      </main>
      <Footer />
    </>
  );
}
