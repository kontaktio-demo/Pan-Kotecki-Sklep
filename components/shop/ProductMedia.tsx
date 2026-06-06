import Image from "next/image";
import ProductVisual from "@/components/ui/ProductVisual";

type Props = {
  image?: string;
  name: string;
  motif: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
};

export default function ProductMedia({ image, name, motif, sizes, className = "", priority }: Props) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }
  return <ProductVisual motif={motif} className={`absolute inset-0 h-full w-full ${className}`} />;
}
