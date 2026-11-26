export default function SocialSidebar({ links }) {
  return (
    <aside className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-4 rounded-l-xl border border-white/10 bg-black/50 p-3 backdrop-blur md:flex">
      {links.map((l, i) => (
        <a key={i} href={l.href} target="_blank" rel="noreferrer"
           className="text-2xl text-[#FF8A00] transition-transform duration-300 hover:scale-125 hover:text-white">
          {l.icon}
        </a>
      ))}
    </aside>
  );
}
