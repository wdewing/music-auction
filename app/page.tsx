type Item = {
  id: string;
  title: string;
  short_description: string;
  image_url: string;
  sale_type: 'auction' | 'fixed';
  buy_now_price: number | null;
  status: 'draft' | 'active' | 'ended';
  auction_end: string | null;
};

async function fetchItems(search: string) {
  const url = search ? `/api/items?search=${encodeURIComponent(search)}` : '/api/items';
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [] as Item[];
  const data = await res.json();
  return (data.items ?? []) as Item[];
}

export default async function HomePage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams?.q ?? '').trim();
  const items = await fetchItems(q);
  return (
    <section style={{ display: 'grid', gap: '1rem' }}>
      <form method="get" action="/" style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          name="q"
          placeholder="Search items..."
          defaultValue={q}
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button type="submit">Search</button>
      </form>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {items.map((it) => (
          <a key={it.id} href={`/items/${it.id}`} style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: '100%', aspectRatio: '4 / 3', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Using img to avoid remote image config for MVP */}
              <img src={it.image_url} alt={it.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ padding: '0.5rem 0.75rem' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{it.title}</div>
              <div style={{ color: '#555', fontSize: 14 }}>{it.short_description}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                {it.sale_type === 'auction' ? (
                  <span>Auction • ends {it.auction_end ? new Date(it.auction_end).toLocaleString() : 'N/A'}</span>
                ) : (
                  <span>For sale • ${it.buy_now_price ?? '-'}</span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
      {items.length === 0 && (
        <p style={{ color: '#666' }}>No items found. Try another search.</p>
      )}
    </section>
  );
}
