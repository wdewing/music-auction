type Item = {
  id: string;
  user_id: string;
  title: string;
  short_description: string;
  long_description: string;
  image_url: string;
  sale_type: 'auction' | 'fixed';
  reserve_price: number | null;
  buy_now_price: number | null;
  status: 'draft' | 'active' | 'ended';
  auction_start: string | null;
  auction_end: string | null;
  created_at: string;
};

async function fetchItem(id: string) {
  const res = await fetch(`/api/items/${id}`, { cache: 'no-store' });
  if (!res.ok) return null as Item | null;
  const data = await res.json();
  return (data.item ?? null) as Item | null;
}

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const item = await fetchItem(params.id);
  if (!item) return <p>Item not found.</p>;
  return (
    <article style={{ display: 'grid', gap: '1rem', maxWidth: 900 }}>
      <h2 style={{ margin: 0 }}>{item.title}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: '1rem' }}>
        <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ width: '100%', aspectRatio: '4 / 3', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={item.image_url} alt={item.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
          </div>
        </div>
        <div>
          <p style={{ color: '#555' }}>{item.short_description}</p>
          <div style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
            {item.sale_type === 'auction' ? (
              <div>Auction • ends {item.auction_end ? new Date(item.auction_end).toLocaleString() : 'N/A'}</div>
            ) : (
              <div>For sale • ${item.buy_now_price ?? '-'}</div>
            )}
          </div>
        </div>
      </div>
      <section>
        <h3>Description</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{item.long_description}</p>
      </section>
    </article>
  );
}

