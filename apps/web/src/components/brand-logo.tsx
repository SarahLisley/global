import Image from 'next/image';

type Props = {
  className?: string;
  width?: number;
  height?: number;
};

export function BrandLogo({ className, width = 180, height = 60 }: Props) {
  return (
    <div className={className}>
      <Image
        src="/images/logo-global-hospitalar.png"
        alt="GLOBAL Hospitalar"
        width={width}
        height={height}
        priority
        unoptimized
      />
    </div>
  );
}