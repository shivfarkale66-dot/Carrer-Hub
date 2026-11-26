import Reveal from "./Reveal";

export default function SectionTitle({ children }) {
  return (
    <Reveal className="relative text-center py-10 select-none">
      <h2 aria-hidden className="absolute inset-0 flex items-center justify-center text-6xl md:text-8xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-gray-500/40 to-transparent">
        {children}
      </h2>
      <h2 className="relative text-4xl md:text-6xl font-black uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#FF8A00] to-[#FFC46B]">
        {children}
      </h2>
    </Reveal>
  );
}
