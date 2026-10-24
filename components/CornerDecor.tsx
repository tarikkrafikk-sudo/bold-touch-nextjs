import Image from "next/image";

export default function CornerDecor() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-0 h-[100px] w-[100px] -scale-x-100 rotate-180 opacity-40 md:h-[170px] md:w-[170px] md:opacity-60"
      >
        <Image src="/assets/corner-amazigh.png" alt="" fill className="object-cover" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 right-0 z-0 h-[100px] w-[100px] opacity-40 md:h-[170px] md:w-[170px] md:opacity-60"
      >
        <Image src="/assets/corner-amazigh.png" alt="" fill className="object-cover" />
      </div>
    </>
  );
}
