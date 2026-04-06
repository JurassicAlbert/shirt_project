import Image from "next/image";
import { productImageUrl } from "@/lib/catalog-images";

type Props = {
  slug: string;
  type: string;
  alt: string;
  className?: string;
};

export function ProductCardImage({ slug, type, alt, className = "h-52 w-full" }: Props) {
  const src = productImageUrl(slug, type);
  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-100 ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
    </div>
  );
}
