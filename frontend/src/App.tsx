import { useState } from 'react';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await response.json();
      setResults(data.results);
      setFilters(data.filters_applied);
    } catch (error) {
      console.error("Error buscando productos:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Navbar Minimalista */}
      <nav className="glass" style={{ margin: '20px', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logo" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
          SucreShop.
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button style={{ background: 'transparent', color: 'var(--text-primary)', fontWeight: 500 }}>Tiendas</button>
          <button className="btn-primary">Ingresar</button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container animate-fade-in" style={{ marginTop: '80px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '16px', background: 'linear-gradient(to right, #f8f9fa, #a0aab2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Encuentra lo que buscas,<br/> sin complicaciones.
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 40px' }}>
          Busca productos en todas las tiendas locales usando lenguaje natural. La inteligencia artificial hará el resto.
        </p>

        {/* Buscador IA */}
        <form onSubmit={handleSearch} style={{ maxWidth: '700px', margin: '0 auto', position: 'relative' }}>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ej: Quiero unos tenis Nike talla 42 color negro para correr..."
            style={{
              width: '100%',
              padding: '20px 24px',
              paddingRight: '60px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              outline: 'none',
              boxShadow: 'var(--shadow-md)',
              transition: 'all var(--transition-fast)'
            }}
          />
          <button 
            type="submit"
            className="btn-primary"
            style={{
              position: 'absolute',
              right: '8px',
              top: '8px',
              bottom: '8px',
              padding: '0 24px',
            }}
          >
            Buscar
          </button>
        </form>

        {/* Resultados */}
        {loading && <p style={{ marginTop: '24px', color: 'var(--text-secondary)' }}>Analizando tu búsqueda con IA...</p>}
        
        {filters && (
          <div style={{ marginTop: '24px', fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
            Filtros detectados: Categoría: {filters.category || 'Todas'} | Color: {filters.color || 'N/A'}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
          marginTop: '40px',
          textAlign: 'left'
        }}>
          {results.map((product) => (
            <div key={product.id} className="glass animate-fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '16px' }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '4px' }}>
                {product.store_name}
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{product.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>Bs {product.price}</span>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Ver más</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
