import Image from "next/image";
import Link from "next/link";

export function BrandLogo({
  href,
  className,
  label = "Meditalk",
}: {
  href: string;
  className: string;
  label?: string;
}) {
  return (
    <Link href={href} className={className} aria-label={label}>
      <Image
        src="/medtalk.png"
        alt="Meditalk"
        width={150}
        height={48}
        priority
        className="brand-image-desktop"
      />
      <Image
        src="/brand-image.png"
        alt="Meditalk"
        width={96}
        height={96}
        priority
        className="brand-image-mobile"
      />
    </Link>
  );
}
