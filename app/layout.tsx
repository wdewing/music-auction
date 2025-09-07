export const metadata = {
  title: "Music Auction",
  description: "Auction site for musical items",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <header style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
          <h1 style={{ margin: 0 }}>Music Auction</h1>
        </header>
        <main style={{ padding: '1rem' }}>{children}</main>
      </body>
    </html>
  );
}

