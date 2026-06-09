/**
 * Decorative skewed brand ribbons behind the pricing cards — pure ornament,
 * hidden from the a11y tree. Opacity-modified `brand` keeps both themes happy.
 * They run along the diagonal edge where the tinted hero backdrop hands off
 * to the plain page background (see the clip-path layer in `pricing-view`).
 */
export function PricingRibbons() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Top-right: wide light band */}
      <div className="absolute top-[28rem] -right-24 h-16 w-[44rem] -rotate-12 rounded-md bg-brand/20 md:top-[30rem] md:h-24" />
      {/* Top-right: saturated band tucked below the light one */}
      <div className="absolute top-[36rem] -right-10 h-10 w-[24rem] -rotate-12 rounded-md bg-brand/60 md:top-[38rem] md:h-14" />
      {/* Small square at the saturated band's left tip */}
      <div className="absolute top-[35rem] right-[24rem] hidden size-10 -rotate-12 rounded-md bg-brand/30 md:top-[37rem] md:block" />
      {/* Bottom-left: saturated band */}
      <div className="absolute top-[48rem] -left-24 h-14 w-[26rem] -rotate-12 rounded-md bg-brand/50 md:top-[44rem] md:h-20" />
      {/* Small light square above the left band's right tip */}
      <div className="absolute top-[45.5rem] left-[14rem] hidden size-9 -rotate-12 rounded-md bg-brand/25 md:top-[41.5rem] md:block" />
    </div>
  );
}
