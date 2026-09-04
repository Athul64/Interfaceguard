export default function Navbar() {
  return (
    <nav className="fixed top-5 left-1/2 -translate-x-1/2 w-[92%] max-w-[1180px] z-10
                     flex items-center justify-between px-7 py-3.5
                     bg-cream/0 backdrop-blur-xl backdrop-saturate-150
                     rounded-full shadow-[0_8px_32px_rgba(15,22,33,0.35)]">
      <div className="flex items-center gap-2.5 font-bold text-[17px] text-cream">
        <span className="w-8 h-8 rounded-[9px] bg-cream/12 border border-cream/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#e8dcc4" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="14" y2="12" />
            <line x1="4" y1="18" x2="17" y2="18" />
          </svg>
        </span>
        InterfaceGuard
      </div>
      <div className="hidden sm:flex gap-8 text-sm font-medium">
        <a href="#" className="text-cream/75 hover:text-cream transition-colors">Documentation</a>
        <a href="#" className="text-cream/75 hover:text-cream transition-colors">Examples</a>
        <a href="#" className="text-cream/75 hover:text-cream transition-colors">About</a>
      </div>
    </nav>
  )
}