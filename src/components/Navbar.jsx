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
      <ul style={{
        listStyle: 'none',
        display: 'flex',
        gap: '1.25rem',
        margin: 0,
        padding: 0,
        fontSize: '0.95rem'
      }}>
        <li><a href="/" style={linkStyle}>Home</a></li>
        <li><a href="/dashboard" style={linkStyle}>Dashboard</a></li>
        <li><a href="/payment" style={linkStyle}>Payment</a></li>
      </ul>
    </nav>
  );
}

const linkStyle = {
  color: '#bbb',
  textDecoration: 'none',
  padding: '0.25rem 0.4rem',
  borderRadius: '4px',
  transition: 'background 0.15s, color 0.15s',
};
