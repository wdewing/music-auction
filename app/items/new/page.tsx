"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewItemPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [longDesc, setLongDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saleType, setSaleType] = useState<'auction' | 'fixed'>('auction');
  const [reservePrice, setReservePrice] = useState<string>('');
  const [buyNowPrice, setBuyNowPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        title,
        short_description: shortDesc,
        long_description: longDesc,
        image_url: imageUrl,
        sale_type: saleType,
      };
      if (saleType === 'auction' && reservePrice) payload.reserve_price = Number(reservePrice);
      if (saleType === 'fixed' && buyNowPrice) payload.buy_now_price = Number(buyNowPrice);
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to create item');
      router.push(`/items/${data.id}`);
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ maxWidth: 640 }}>
      <h2>New Item</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required maxLength={120} />
        <input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="Short description (<=280 chars)" required maxLength={280} />
        <textarea value={longDesc} onChange={(e) => setLongDesc(e.target.value)} placeholder="Long description" rows={8} required />
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (https://...)" required />

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="radio" name="sale_type" value="auction" checked={saleType === 'auction'} onChange={() => setSaleType('auction')} />
            Auction (7 days)
          </label>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="radio" name="sale_type" value="fixed" checked={saleType === 'fixed'} onChange={() => setSaleType('fixed')} />
            For sale (fixed price)
          </label>
        </div>

        {saleType === 'auction' ? (
          <input type="number" min="0" step="0.01" value={reservePrice} onChange={(e) => setReservePrice(e.target.value)} placeholder="Reserve price (optional)" />
        ) : (
          <input type="number" min="0.01" step="0.01" value={buyNowPrice} onChange={(e) => setBuyNowPrice(e.target.value)} placeholder="Final price" required />
        )}

        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create item'}</button>
        {error && <div style={{ color: 'crimson' }}>{error}</div>}
      </form>
    </section>
  );
}

