export const metadata = {
  title: "Music Auction",
  description: "Auction site for musical items",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <header style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h1 style={{ margin: 0 }}>Music Auction</h1>
            </a>
            <nav style={{ display: 'flex', gap: '1rem' }}>
              <a href="/items/new">New Item</a>
              <a href="/signup">Sign up</a>
              <a href="/login">Log in</a>
            </nav>
          </div>
        </header>
        <main style={{ padding: '1rem' }}>{children}</main>
      </body>
    </html>
  );
}
