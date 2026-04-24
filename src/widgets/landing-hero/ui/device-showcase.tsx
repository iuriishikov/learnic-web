import Image from 'next/image';

import { PLACEHOLDERS } from '@/shared/lib/placeholders';
import { cn } from '@/shared/lib/utils';

type DeviceShowcaseProps = {
  className?: string;
};

const DESKTOP_SHADOW =
  'shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.10),-50px_0_70px_-30px_rgba(0,0,0,0.08),50px_0_70px_-30px_rgba(0,0,0,0.08)]';
const DESKTOP_SHADOW_DARK =
  'dark:shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.45),-50px_0_70px_-30px_rgba(0,0,0,0.35),50px_0_70px_-30px_rgba(0,0,0,0.35)]';

const PHONE_SHADOW =
  'shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.10),-35px_0_60px_-25px_rgba(0,0,0,0.08),35px_0_60px_-25px_rgba(0,0,0,0.08)]';
const PHONE_SHADOW_DARK =
  'dark:shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.45),-35px_0_60px_-25px_rgba(0,0,0,0.30),35px_0_60px_-25px_rgba(0,0,0,0.30)]';

export function DeviceShowcase({ className }: DeviceShowcaseProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <div className="mx-auto hidden w-full max-w-[1200px] sm:block">
        <DesktopFrame />
      </div>
      <div className="mx-auto block w-full max-w-[420px] sm:hidden">
        <PhoneFrame />
      </div>
    </div>
  );
}

function DesktopFrame() {
  return (
    // outer hairline
    <div
      className={cn(
        'relative rounded-t-[32px] bg-foreground/30 p-px pb-0',
        DESKTOP_SHADOW,
        DESKTOP_SHADOW_DARK,
      )}
    >
      {/* outer body */}
      <div className="relative rounded-t-[31px] bg-background p-[10px] pb-0">
        {/* middle hairline */}
        <div className="relative rounded-t-[21px] bg-foreground/25 p-px pb-0">
          {/* inner body */}
          <div className="relative rounded-t-[20px] bg-background p-[5px] pb-0">
            {/* inner hairline — bezel around screen */}
            <div className="relative rounded-t-[15px] bg-foreground/25 p-px pb-0">
              {/* screen */}
              <div className="relative overflow-hidden rounded-t-[14px]">
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={PLACEHOLDERS.dynamicMesh}
                    alt=""
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneFrame() {
  return (
    // outer hairline
    <div
      className={cn(
        'relative rounded-t-[52px] bg-foreground/30 p-px pb-0',
        PHONE_SHADOW,
        PHONE_SHADOW_DARK,
      )}
    >
      {/* outer body */}
      <div className="relative rounded-t-[51px] bg-background p-[8px] pb-0">
        {/* middle hairline */}
        <div className="relative rounded-t-[44px] bg-foreground/25 p-px pb-0">
          {/* inner body */}
          <div className="relative rounded-t-[43px] bg-background p-[4px] pb-0">
            {/* inner hairline — bezel around screen */}
            <div className="relative rounded-t-[39px] bg-foreground/25 p-px pb-0">
              {/* screen */}
              <div className="relative overflow-hidden rounded-t-[38px]">
                <div className="relative aspect-[9/16] w-full">
                  <Image
                    src={PLACEHOLDERS.dynamicMesh}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
