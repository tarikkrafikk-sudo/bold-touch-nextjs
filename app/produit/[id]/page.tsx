import { notFound } from "next/navigation";
import Header from "@/components/Header";
import TopBanner from "@/components/TopBanner";
import Footer from "@/components/Footer";
import ProductConfigurator from "@/components/ProductConfigurator";
import { getProducts } from "@/lib/products-store";

export const dynamic = "force-dynamic";

export default function ProductPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { inspiration?: string };
}) {
  const product = getProducts().find((p) => p.id === params.id);

  if (!product) {
    notFound();
  }

  return (
    <>
      <TopBanner />
      <Header />
      <main className="bg-cream">
        <ProductConfigurator product={product} inspirationImage={searchParams?.inspiration} />
      </main>
      <Footer />
    </>
  );
}
