import { getProducts } from "@/lib/products";
import HeroBanner from "@/components/sections/HeroBanner";
import TrustBar from "@/components/sections/TrustBar";
import Categories from "@/components/sections/Categories";
import ProductRow from "@/components/sections/ProductRow";
import FeatureBand from "@/components/sections/FeatureBand";
import AboutTeaser from "@/components/sections/AboutTeaser";
import Newsletter from "@/components/sections/Newsletter";

export default async function Home() {
  const all = await getProducts();
  const bestsellers = [...all.filter((p) => p.bestseller), ...all.filter((p) => !p.bestseller)].slice(0, 8);
  const forOwner = all
    .filter((p) => p.category === "dla-wlasciciela" || p.category === "kubki")
    .slice(0, 8);

  return (
    <>
      <HeroBanner />
      <TrustBar />
      <Categories />
      <ProductRow
        title="Bestsellery"
        subtitle="Najczęściej wybierane przez kotów (i ich ludzi)"
        products={bestsellers}
      />
      <FeatureBand />
      <AboutTeaser />
      <ProductRow
        title="Nie tylko dla kota"
        subtitle="Kubki i drobiazgi dla prawdziwych kociarzy"
        products={forOwner}
        href="/sklep?kategoria=dla-wlasciciela"
      />
      <Newsletter />
    </>
  );
}
