import { ShopFooter } from "@/components/shop/ShopFooter";
import { ShopHeader } from "@/components/shop/ShopHeader";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ShopHeader />
      <main>{children}</main>
      <ShopFooter />
    </>
  );
}
