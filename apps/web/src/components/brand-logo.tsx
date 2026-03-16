import Image from 'next/image';
import clsx from 'clsx';

type Props = {
  className?: string;
  width?: number;
  height?: number;
};

export function BrandLogo({ className, width = 180, height = 60 }: Props) {
  return (
    <div className={clsx('flex justify-center', className)}>
      <Image
        src="/images/logo-global-hospitalar.png"
        alt="GLOBAL Hospitalar"
        width={width}
        height={height}
        style={{ width: width, height: 'auto' }}
        priority
        unoptimized
      />
    </div>
  );
}