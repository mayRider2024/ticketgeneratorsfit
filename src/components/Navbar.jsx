export default function Navbar() {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        background: '#0f0f0f',
        borderBottom: '1px solid #222',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        color: '#fff',
        fontFamily: 'var(--font-geist-sans, system-ui)'
      }}
    >
      <div style={{ fontWeight: 600, letterSpacing: '0.5px' }}>TicketGen</div>
      {/* Navigation links removed as requested */}
    </nav>
  );
}
