import React, { useState, useEffect } from 'react';

// --- ICONOS SVG PREMIUM ---
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const StoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);
const BagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
);
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);

function App() {
  // --- ESTADOS PRINCIPALES ---
  const [activeView, setActiveView] = useState<'catalog' | 'auth' | 'seller' | 'admin' | 'orders'>('catalog');
  const [session, setSession] = useState<any>(null);
  
  // Alertas / Mensajes
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Catálogo y Búsqueda IA
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<any>(null);
  const [allStores, setAllStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // Formulario de Autenticación
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<'cliente' | 'vendedor'>('cliente');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');

  // Vendedor Panel
  const [sellerTab, setSellerTab] = useState<'my-stores' | 'my-products' | 'new-store' | 'new-product'>('my-stores');
  const [myStores, setMyStores] = useState<any[]>([]);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  // Form Tienda
  const [storeName, setStoreName] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [storeLogo, setStoreLogo] = useState('');
  const [storeWebsite, setStoreWebsite] = useState('');
  // Form Producto
  const [prodStoreId, setProdStoreId] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodColor, setProdColor] = useState('');
  const [prodSize, setProdSize] = useState('');
  const [prodDelivery, setProdDelivery] = useState(true);
  const [prodPickup, setProdPickup] = useState(true);

  // Admin Panel
  const [adminTab, setAdminTab] = useState<'stores' | 'products'>('stores');
  const [pendingStores, setPendingStores] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [rejectionModal, setRejectionModal] = useState<{ type: 'store' | 'product'; id: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Cliente Compra / QR Modal
  const [qrModal, setQrModal] = useState<{ product: any; type: 'compra_qr' | 'reserva_recojo' } | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrSuccess, setQrSuccess] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);

  // --- CARGA INICIAL DE SESIÓN ---
  useEffect(() => {
    const savedSession = localStorage.getItem('sucreshop_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession(parsed);
        // Si hay sesión y el rol es admin, vamos a admin, si no a catálogo
        if (parsed.user.role === 'admin') {
          setActiveView('admin');
        }
      } catch (e) {
        localStorage.removeItem('sucreshop_session');
      }
    }
  }, []);

  // Cargar datos del catálogo y tiendas públicas al iniciar
  useEffect(() => {
    fetchCatalog();
    fetchPublicStores();
  }, []);

  // Recargar datos cuando cambia la vista
  useEffect(() => {
    if (activeView === 'seller' && session?.user?.role === 'vendedor') {
      fetchSellerData();
    } else if (activeView === 'admin' && session?.user?.role === 'admin') {
      fetchAdminPending();
    } else if (activeView === 'orders' && session) {
      fetchOrderHistory();
    }
  }, [activeView, session]);

  // --- ALERT TOAST AUTO-HIDE ---
  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // --- HELPERS DE API ---
  const getHeaders = () => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const fetchPublicStores = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/stores');
      const data = await response.json();
      if (response.ok) {
        setAllStores(data);
      }
    } catch (e) {
      console.error('Error fetching public stores:', e);
    }
  };

  const fetchCatalog = async (query = '') => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/search', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ query: query })
      });
      const data = await response.json();
      if (response.ok) {
        setResults(data.results);
        setFilters(data.filters_applied);
      }
    } catch (e) {
      console.error('Error fetching catalog:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerData = async () => {
    try {
      // 1. Tiendas del vendedor
      const responseStores = await fetch('http://localhost:8000/api/stores', {
        headers: getHeaders()
      });
      const storesData = await responseStores.json();
      if (responseStores.ok) {
        setMyStores(storesData);
        if (storesData.length > 0) {
          setProdStoreId(storesData[0].id); // Auto-seleccionar la primera tienda en el formulario
        }
      }

      // 2. Productos
      const responseProducts = await fetch('http://localhost:8000/api/products', {
        headers: getHeaders()
      });
      const productsData = await responseProducts.json();
      if (responseProducts.ok) {
        setMyProducts(productsData);
      }
    } catch (e) {
      console.error('Error loading seller data:', e);
    }
  };

  const fetchAdminPending = async () => {
    try {
      const respStores = await fetch('http://localhost:8000/api/admin/pending-stores', {
        headers: getHeaders()
      });
      const stores = await respStores.json();
      if (respStores.ok) setPendingStores(stores);

      const respProds = await fetch('http://localhost:8000/api/admin/pending-products', {
        headers: getHeaders()
      });
      const prods = await respProds.json();
      if (respProds.ok) setPendingProducts(prods);
    } catch (e) {
      console.error('Error loading admin pending list:', e);
    }
  };

  const fetchOrderHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/orders', {
        headers: getHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        setOrderHistory(data);
      }
    } catch (e) {
      console.error('Error loading order history:', e);
    }
  };

  // --- CONTROLADORES DE ACCIONES ---

  // Autenticación: Registro y Login
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      showAlert('error', 'Por favor completa todos los campos requeridos.');
      return;
    }

    try {
      if (authMode === 'register') {
        if (!authFullName) {
          showAlert('error', 'Por favor ingresa tu nombre completo.');
          return;
        }
        const response = await fetch('http://localhost:8000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authEmail,
            password: authPassword,
            role: authRole,
            full_name: authFullName
          })
        });
        const data = await response.json();
        if (response.ok) {
          showAlert('success', data.message);
          setAuthMode('login');
        } else {
          showAlert('error', data.detail || 'Error al registrar usuario.');
        }
      } else {
        // Login
        const response = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authEmail,
            password: authPassword
          })
        });
        const data = await response.json();
        if (response.ok) {
          setSession(data);
          localStorage.setItem('sucreshop_session', JSON.stringify(data));
          showAlert('success', `¡Bienvenido de nuevo, ${data.user.full_name}!`);
          
          if (data.user.role === 'admin') {
            setActiveView('admin');
          } else if (data.user.role === 'vendedor') {
            setActiveView('seller');
          } else {
            setActiveView('catalog');
          }
          
          // Limpiar forms
          setAuthEmail('');
          setAuthPassword('');
          setAuthFullName('');
        } else {
          showAlert('error', data.detail || 'Credenciales incorrectas.');
        }
      }
    } catch (e) {
      showAlert('error', 'Error en la conexión con el servidor.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sucreshop_session');
    setSession(null);
    setActiveView('catalog');
    showAlert('success', 'Sesión cerrada exitosamente.');
  };

  // Vendedor: Crear Tienda
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName) {
      showAlert('error', 'El nombre de la tienda es obligatorio.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/stores', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: storeName,
          description: storeDesc,
          logo_url: storeLogo || 'https://images.unsplash.com/photo-1472851294608-062f824d296e?auto=format&fit=crop&q=80&w=200',
          website: storeWebsite
        })
      });
      const data = await response.json();
      if (response.ok) {
        showAlert('success', data.message);
        setStoreName('');
        setStoreDesc('');
        setStoreLogo('');
        setStoreWebsite('');
        setSellerTab('my-stores');
        fetchSellerData();
      } else {
        showAlert('error', data.detail || 'Error al solicitar apertura de tienda.');
      }
    } catch (e) {
      showAlert('error', 'Error de conexión al crear tienda.');
    }
  };

  // Vendedor: Crear Producto
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodStoreId || !prodName || !prodPrice || !prodCategory || !prodStock) {
      showAlert('error', 'Por favor completa todos los campos del producto.');
      return;
    }

    // Configurar atributos opcionales
    const attributes: any = {};
    if (prodColor) attributes['color'] = prodColor;
    if (prodSize) attributes['size'] = prodSize;

    try {
      const response = await fetch('http://localhost:8000/api/products', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          store_id: prodStoreId,
          name: prodName,
          description: prodDesc,
          price: parseFloat(prodPrice),
          category: prodCategory,
          image_url: prodImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400',
          stock: parseInt(prodStock),
          attributes: attributes,
          delivery_options: {
            delivery: prodDelivery,
            pickup: prodPickup
          }
        })
      });
      const data = await response.json();
      if (response.ok) {
        showAlert('success', data.message);
        setProdName('');
        setProdDesc('');
        setProdPrice('');
        setProdCategory('');
        setProdImage('');
        setProdStock('');
        setProdColor('');
        setProdSize('');
        setProdDelivery(true);
        setProdPickup(true);
        setSellerTab('my-products');
        fetchSellerData();
      } else {
        showAlert('error', data.detail || 'Error al publicar producto.');
      }
    } catch (e) {
      showAlert('error', 'Error de conexión al agregar producto.');
    }
  };

  // Administrador: Aprobar Tienda o Producto
  const handleAdminApproval = async (id: string, type: 'store' | 'product', status: 'aprobado' | 'rechazado') => {
    if (status === 'rechazado' && !rejectionReason.trim()) {
      setRejectionModal({ type, id });
      return;
    }

    try {
      const endpoint = type === 'store' 
        ? `http://localhost:8000/api/admin/approve-store/${id}` 
        : `http://localhost:8000/api/admin/approve-product/${id}`;
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          status: status,
          rejection_reason: status === 'rechazado' ? rejectionReason : null
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        showAlert('success', data.message);
        setRejectionModal(null);
        setRejectionReason('');
        fetchAdminPending();
      } else {
        showAlert('error', data.detail || 'Error al procesar solicitud.');
      }
    } catch (e) {
      showAlert('error', 'Error de conexión en administración.');
    }
  };

  // Cliente: Realizar Compra o Reserva (Simulado con QR)
  const handleConfirmOrder = async () => {
    if (!session) {
      showAlert('error', 'Debes iniciar sesión como Cliente para realizar una compra o reserva.');
      setActiveView('auth');
      setAuthMode('login');
      setQrModal(null);
      return;
    }

    if (session.user.role !== 'cliente') {
      showAlert('error', 'Solo los usuarios con rol "Cliente" pueden comprar o reservar productos.');
      setQrModal(null);
      return;
    }

    setQrLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/orders', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          product_id: qrModal?.product.id,
          quantity: orderQuantity,
          type: qrModal?.type
        })
      });
      const data = await response.json();
      if (response.ok) {
        if (qrModal?.type === 'compra_qr') {
          // Simular tiempo de lectura/espera de QR
          setTimeout(() => {
            setQrLoading(false);
            setQrSuccess(true);
            showAlert('success', '¡Pago QR Simulado procesado con éxito!');
            fetchCatalog(); // Actualizar stocks en interfaz
          }, 3000);
        } else {
          // Reserva directa
          setQrLoading(false);
          setQrSuccess(true);
          showAlert('success', 'Reserva registrada exitosamente. Recoge en tienda.');
          fetchCatalog();
        }
      } else {
        setQrLoading(false);
        showAlert('error', data.detail || 'Error al procesar el pedido.');
      }
    } catch (e) {
      setQrLoading(false);
      showAlert('error', 'Error de conexión al procesar pedido.');
    }
  };

  // Catálogo: Filtrado por tienda manual
  const handleStoreFilter = (storeId: string | null) => {
    setSelectedStoreId(storeId);
  };

  // Búsqueda IA onSubmit
  const handleIASearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalog(searchQuery);
  };

  // Mostrar productos según filtro de tienda seleccionado
  const getFilteredCatalogResults = () => {
    if (selectedStoreId) {
      return results.filter(p => p.store_id === selectedStoreId || p.stores?.id === selectedStoreId);
    }
    return results;
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Toast Notification Alert */}
      {alert && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 24px',
          borderRadius: 'var(--radius-md)',
          background: alert.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: alert.type === 'success' ? '1px solid var(--state-approved)' : '1px solid var(--state-rejected)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(12px)',
          animation: 'modalSlideUp 0.3s ease forwards'
        }}>
          {alert.type === 'success' ? <CheckIcon /> : <AlertIcon />}
          <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{alert.message}</span>
        </div>
      )}

      {/* NAVBAR GLASSMORPHISM */}
      <nav className="glass" style={{
        margin: '20px',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: '20px',
        zIndex: 900
      }}>
        <div 
          onClick={() => { setActiveView('catalog'); setSelectedStoreId(null); }} 
          style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ background: 'linear-gradient(135deg, #a5b4fc, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SucreShop.</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className={`btn-secondary ${activeView === 'catalog' ? 'active' : ''}`}
            onClick={() => { setActiveView('catalog'); setSelectedStoreId(null); }}
            style={{ padding: '8px 16px', fontSize: '0.9rem', backgroundColor: activeView === 'catalog' ? 'rgba(99, 102, 241, 0.15)' : 'transparent', border: activeView === 'catalog' ? '1px solid var(--accent-primary)' : 'none' }}
          >
            Ver Productos
          </button>

          {/* Vistas basadas en Roles */}
          {session?.user?.role === 'cliente' && (
            <button 
              className={`btn-secondary ${activeView === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveView('orders')}
              style={{ padding: '8px 16px', fontSize: '0.9rem', backgroundColor: activeView === 'orders' ? 'rgba(99, 102, 241, 0.15)' : 'transparent', border: activeView === 'orders' ? '1px solid var(--accent-primary)' : 'none' }}
            >
              Mis Compras
            </button>
          )}

          {session?.user?.role === 'vendedor' && (
            <button 
              className={`btn-secondary ${activeView === 'seller' ? 'active' : ''}`}
              onClick={() => setActiveView('seller')}
              style={{ padding: '8px 16px', fontSize: '0.9rem', backgroundColor: activeView === 'seller' ? 'rgba(99, 102, 241, 0.15)' : 'transparent', border: activeView === 'seller' ? '1px solid var(--accent-primary)' : 'none' }}
            >
              Panel Vendedor
            </button>
          )}

          {session?.user?.role === 'admin' && (
            <button 
              className={`btn-secondary ${activeView === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveView('admin')}
              style={{ padding: '8px 16px', fontSize: '0.9rem', backgroundColor: activeView === 'admin' ? 'rgba(99, 102, 241, 0.15)' : 'transparent', border: activeView === 'admin' ? '1px solid var(--accent-primary)' : 'none' }}
            >
              Panel Administración
            </button>
          )}

          {/* Estado de la cuenta o Botón Iniciar Sesión */}
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
              <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{session.user.full_name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {session.user.role === 'admin' ? 'Administrador' : session.user.role}
                </div>
              </div>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                Salir
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { setActiveView('auth'); setAuthMode('login'); }} 
              className="btn-primary" 
              style={{ padding: '8px 20px', fontSize: '0.9rem', marginLeft: '12px' }}
            >
              <UserIcon /> Ingresar
            </button>
          )}
        </div>
      </nav>

      {/* --- VISTA: CATÁLOGO PÚBLICO --- */}
      {activeView === 'catalog' && (
        <main className="container animate-fade-in" style={{ flex: 1, paddingBottom: '80px', marginTop: '40px', textAlign: 'center' }}>
          
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #a0aab2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Encuentra lo que buscas,<br/> sin complicaciones.
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto 40px' }}>
            Busca sombreros artesanales, tecnología, y mucho más en las tiendas locales de Sucre usando lenguaje natural impulsado por IA.
          </p>

          {/* Formulario Buscador IA */}
          <form onSubmit={handleIASearchSubmit} style={{ maxWidth: '700px', margin: '0 auto 50px', position: 'relative' }}>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej: Quiero un sombrero de paja color beige talla M o algo de tecnología..."
              style={{
                width: '100%',
                padding: '18px 24px',
                paddingRight: '60px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '1.05rem',
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
                padding: '0 20px',
              }}
            >
              <SearchIcon />
            </button>
          </form>

          {/* Filtros Inteligentes Detectados */}
          {filters && (
            <div className="glass animate-fade-in" style={{ maxWidth: '600px', margin: '-30px auto 40px', padding: '8px 20px', fontSize: '0.85rem', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '8px', borderStyle: 'dashed' }}>
              <span style={{ fontWeight: 700 }}>🔍 INTENCIÓN IA:</span>
              <span>Categoría: <strong>{filters.category || 'Todas'}</strong></span>
              <span>|</span>
              <span>Color: <strong>{filters.color || 'N/A'}</strong></span>
              {filters.size && (
                <>
                  <span>|</span>
                  <span>Talla: <strong>{filters.size}</strong></span>
                </>
              )}
              {filters.max_price && (
                <>
                  <span>|</span>
                  <span>Precio Máx: <strong>Bs {filters.max_price}</strong></span>
                </>
              )}
            </div>
          )}

          {/* Barra de Filtrado Rápido por Tiendas */}
          <div style={{ marginBottom: '40px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtrar por Tienda Local</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => handleStoreFilter(null)}
                className="btn-secondary"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  backgroundColor: selectedStoreId === null ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                  color: selectedStoreId === null ? 'white' : 'var(--text-primary)',
                  borderColor: selectedStoreId === null ? 'var(--accent-primary)' : 'var(--border-color)'
                }}
              >
                Todas las Tiendas
              </button>
              {allStores.map(store => (
                <button
                  key={store.id}
                  onClick={() => handleStoreFilter(store.id)}
                  className="btn-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    backgroundColor: selectedStoreId === store.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                    color: selectedStoreId === store.id ? 'white' : 'var(--text-primary)',
                    borderColor: selectedStoreId === store.id ? 'var(--accent-primary)' : 'var(--border-color)'
                  }}
                >
                  🏢 {store.name}
                </button>
              ))}
            </div>
          </div>

          {/* Resultados de Catálogo */}
          {loading ? (
            <div style={{ padding: '60px 0' }}>
              <div className="qr-spinner" style={{ margin: '0 auto 20px', width: '50px', height: '50px' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>Analizando con IA e indexando catálogo...</p>
            </div>
          ) : getFilteredCatalogResults().length === 0 ? (
            <div className="glass" style={{ padding: '60px', marginTop: '20px' }}>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>No se encontraron productos disponibles en este momento.</p>
              <button onClick={() => { setSearchQuery(''); fetchCatalog(); setSelectedStoreId(null); }} className="btn-secondary" style={{ marginTop: '20px' }}>Restablecer Catálogo</button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
              textAlign: 'left'
            }}>
              {getFilteredCatalogResults().map((product) => {
                const isOutOfStock = product.stock <= 0;
                const devOpts = product.delivery_options || { delivery: true, pickup: true };
                
                return (
                  <div key={product.id} className="glass animate-fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '16px', opacity: isOutOfStock ? 0.5 : 1 }} 
                    />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        🏢 {product.store_name || product.stores?.name}
                      </span>
                      {isOutOfStock ? (
                        <span className="badge badge-rejected">Agotado</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Stock: <strong>{product.stock}</strong></span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 600 }}>{product.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.description}
                    </p>

                    {/* Atributos */}
                    {product.attributes && Object.keys(product.attributes).length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        {Object.entries(product.attributes).map(([key, val]: any) => (
                          <span key={key} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px' }}>
                            {key}: <strong>{val}</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Opciones de Entrega */}
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: devOpts.delivery ? 'var(--state-approved)' : 'inherit' }}>
                        {devOpts.delivery ? '✅' : '❌'} Delivery
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: devOpts.pickup ? 'var(--state-approved)' : 'inherit' }}>
                        {devOpts.pickup ? '✅' : '❌'} Recojo Tienda
                      </span>
                    </div>

                    {/* Precios y Acciones */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>Bs {product.price}</span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button 
                          className="btn-primary" 
                          disabled={isOutOfStock || !devOpts.delivery}
                          onClick={() => { setQrModal({ product, type: 'compra_qr' }); setOrderQuantity(1); setQrSuccess(false); }}
                          style={{
                            padding: '10px',
                            fontSize: '0.8rem',
                            opacity: (isOutOfStock || !devOpts.delivery) ? 0.35 : 1,
                            cursor: (isOutOfStock || !devOpts.delivery) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Pagar QR
                        </button>
                        <button 
                          className="btn-secondary" 
                          disabled={isOutOfStock || !devOpts.pickup}
                          onClick={() => { setQrModal({ product, type: 'reserva_recojo' }); setOrderQuantity(1); setQrSuccess(false); }}
                          style={{
                            padding: '10px',
                            fontSize: '0.8rem',
                            opacity: (isOutOfStock || !devOpts.pickup) ? 0.35 : 1,
                            cursor: (isOutOfStock || !devOpts.pickup) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Reservar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* --- VISTA: AUTENTICACIÓN (LOGIN / REGISTRO) --- */}
      {activeView === 'auth' && (
        <main className="container animate-fade-in" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '450px', padding: '40px' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '8px', textAlign: 'center' }}>
              {authMode === 'login' ? 'Bienvenido a SucreShop' : 'Crea tu Cuenta'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '30px', textAlign: 'center' }}>
              {authMode === 'login' ? 'Ingresa tus credenciales para administrar tus compras y tiendas.' : 'Únete a la red comercial más moderna de Sucre.'}
            </p>

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Nombre Completo</label>
                    <input 
                      type="text" 
                      className="input-control"
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Selecciona tu Rol</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setAuthRole('cliente')}
                        style={{
                          backgroundColor: authRole === 'cliente' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          borderColor: authRole === 'cliente' ? 'var(--accent-primary)' : 'var(--border-color)',
                          color: authRole === 'cliente' ? 'white' : 'var(--text-secondary)'
                        }}
                      >
                        Cliente / Comprador
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setAuthRole('vendedor')}
                        style={{
                          backgroundColor: authRole === 'vendedor' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          borderColor: authRole === 'vendedor' ? 'var(--accent-primary)' : 'var(--border-color)',
                          color: authRole === 'vendedor' ? 'white' : 'var(--text-secondary)'
                        }}
                      >
                        Vendedor / Tienda
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="input-control"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="ejemplo@sucreshop.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input 
                  type="password" 
                  className="input-control"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', marginTop: '10px' }}>
                {authMode === 'login' ? 'Iniciar Sesión' : 'Registrarme'}
              </button>
            </form>

            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {authMode === 'login' ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
              </span>{' '}
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                style={{ background: 'transparent', color: 'var(--accent-primary)', fontWeight: 600 }}
              >
                {authMode === 'login' ? 'Regístrate aquí' : 'Inicia Sesión'}
              </button>
            </div>

            {/* Credenciales de Prueba en login */}
            {authMode === 'login' && (
              <div className="glass animate-fade-in" style={{ marginTop: '24px', padding: '16px', fontSize: '0.8rem', textAlign: 'left' }}>
                <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--accent-primary)' }}>🔑 Credenciales de Prueba:</strong>
                <div>👤 Admin: <code style={{ color: '#fff' }}>admin@sucreshop.com</code> / <code style={{ color: '#fff' }}>admin123</code></div>
                <div style={{ marginTop: '4px' }}>👤 Vendedor: <code style={{ color: '#fff' }}>carlos@vendedor.com</code> / <code style={{ color: '#fff' }}>vendedor123</code></div>
                <div style={{ marginTop: '4px' }}>👤 Cliente: <code style={{ color: '#fff' }}>juan@cliente.com</code> / <code style={{ color: '#fff' }}>cliente123</code></div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* --- VISTA: HISTORIAL DE ÓRDENES (CLIENTE) --- */}
      {activeView === 'orders' && (
        <main className="container animate-fade-in" style={{ flex: 1, padding: '40px 0' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>Mis Compras y Reservas</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Historial y estado de tus compras pagadas por QR y reservas para recojo.</p>

          {orderHistory.length === 0 ? (
            <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>No has realizado ninguna compra o reserva todavía.</p>
              <button onClick={() => setActiveView('catalog')} className="btn-primary" style={{ marginTop: '20px' }}>Comenzar a Comprar</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orderHistory.map((order) => (
                <div key={order.id} className="glass" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src={order.products?.image_url} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{order.products?.stores?.name}</div>
                      <h4 style={{ fontSize: '1.15rem', margin: '4px 0' }}>{order.products?.name}</h4>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Cantidad: <strong>{order.quantity}</strong> | Total: <strong>Bs {order.total_price}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className={`badge ${order.type === 'compra_qr' ? 'badge-approved' : 'badge-pending'}`}>
                        {order.type === 'compra_qr' ? '💳 QR Pagado' : '🏪 Reserva Recojo'}
                      </span>
                      <span className={`badge ${order.status === 'completado' ? 'badge-approved' : order.status === 'pendiente' ? 'badge-pending' : 'badge-rejected'}`}>
                        {order.status}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Fecha: {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* --- VISTA: PANEL DEL VENDEDOR --- */}
      {activeView === 'seller' && session?.user?.role === 'vendedor' && (
        <main className="container animate-fade-in" style={{ flex: 1, padding: '40px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '2.2rem' }}>Panel de Ventas</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Administra tus múltiples tiendas locales y catálogo de productos.</p>
            </div>
            
            <div className="tabs-container" style={{ margin: 0 }}>
              <button className={`tab-btn ${sellerTab === 'my-stores' ? 'active' : ''}`} onClick={() => setSellerTab('my-stores')}>Mis Tiendas</button>
              <button className={`tab-btn ${sellerTab === 'my-products' ? 'active' : ''}`} onClick={() => setSellerTab('my-products')}>Productos</button>
              <button className={`tab-btn ${sellerTab === 'new-store' ? 'active' : ''}`} onClick={() => setSellerTab('new-store')}>+ Crear Tienda</button>
              <button className={`tab-btn ${sellerTab === 'new-product' ? 'active' : ''}`} onClick={() => setSellerTab('new-product')}>+ Publicar Producto</button>
            </div>
          </div>

          {/* TAB 1: MIS TIENDAS */}
          {sellerTab === 'my-stores' && (
            <div>
              {myStores.length === 0 ? (
                <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Aún no has creado ninguna tienda.</p>
                  <button onClick={() => setSellerTab('new-store')} className="btn-primary" style={{ marginTop: '20px' }}>Crear Mi Primera Tienda</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                  {myStores.map((store) => (
                    <div key={store.id} className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <img src={store.logo_url} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%' }} />
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1.3rem' }}>{store.name}</h3>
                          <span className={`badge ${store.status === 'aprobado' ? 'badge-approved' : store.status === 'pendiente' ? 'badge-pending' : 'badge-rejected'}`}>
                            {store.status}
                          </span>
                        </div>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1 }}>{store.description}</p>
                      {store.website && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sitio: <a href={store.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>{store.website}</a></span>}
                      
                      {store.status === 'rechazado' && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                          <strong style={{ color: 'var(--state-rejected)', display: 'block', marginBottom: '2px' }}>Motivo de Rechazo:</strong>
                          <span style={{ color: 'var(--text-primary)' }}>{store.rejection_reason || 'Sin justificación provista.'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MIS PRODUCTOS */}
          {sellerTab === 'my-products' && (
            <div>
              {myProducts.length === 0 ? (
                <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Aún no has publicado ningún producto.</p>
                  <button onClick={() => setSellerTab('new-product')} className="btn-primary" style={{ marginTop: '20px' }}>Publicar Mi Primer Producto</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {myProducts.map((product) => {
                    const devOpts = product.delivery_options || { delivery: true, pickup: true };
                    return (
                      <div key={product.id} className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <img src={product.image_url} alt="" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                            🏢 {product.stores?.name}
                          </span>
                          <span className={`badge ${product.status === 'aprobado' ? 'badge-approved' : product.status === 'pendiente' ? 'badge-pending' : 'badge-rejected'}`}>
                            {product.status}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.15rem' }}>{product.name}</h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Precio: <strong>Bs {product.price}</strong> | Stock: <strong>{product.stock}</strong></div>
                        
                        {/* Opciones de entrega */}
                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>{devOpts.delivery ? '🚚 Delivery: Sí' : '❌ Delivery: No'}</span>
                          <span>{devOpts.pickup ? '🏪 Recojo: Sí' : '❌ Recojo: No'}</span>
                        </div>

                        {product.status === 'rechazado' && (
                          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginTop: 'auto' }}>
                            <strong style={{ color: 'var(--state-rejected)', display: 'block', marginBottom: '2px' }}>Motivo de Rechazo:</strong>
                            <span style={{ color: 'var(--text-primary)' }}>{product.rejection_reason || 'Sin justificación provista.'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CREAR TIENDA */}
          {sellerTab === 'new-store' && (
            <div className="glass" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Solicitud de Apertura de Tienda</h3>
              <form onSubmit={handleCreateStore}>
                <div className="form-group">
                  <label className="form-label">Nombre de la Tienda *</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={storeName} 
                    onChange={(e) => setStoreName(e.target.value)} 
                    placeholder="Ej. Tienda de Sombreros Tradicionales" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea 
                    className="input-control" 
                    rows={4} 
                    value={storeDesc} 
                    onChange={(e) => setStoreDesc(e.target.value)} 
                    placeholder="Describe los productos, ubicación o valor de tu tienda..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">URL del Logo (Opcional)</label>
                  <input 
                    type="url" 
                    className="input-control" 
                    value={storeLogo} 
                    onChange={(e) => setStoreLogo(e.target.value)} 
                    placeholder="https://ejemplo.com/logo.jpg" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sitio Web (Opcional)</label>
                  <input 
                    type="url" 
                    className="input-control" 
                    value={storeWebsite} 
                    onChange={(e) => setStoreWebsite(e.target.value)} 
                    placeholder="https://mitienda.com" 
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px' }}>Solicitar Apertura</button>
              </form>
            </div>
          )}

          {/* TAB 4: PUBLICAR PRODUCTO */}
          {sellerTab === 'new-product' && (
            <div className="glass" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Publicar Nuevo Producto</h3>
              {myStores.filter(s => s.status === 'aprobado').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p style={{ color: 'var(--state-rejected)' }}><strong>⚠️ Error:</strong> Debes tener al menos una tienda <strong>aprobada</strong> por el administrador para poder publicar productos.</p>
                  <button onClick={() => setSellerTab('my-stores')} className="btn-secondary" style={{ marginTop: '20px' }}>Ver Estado de mis Tiendas</button>
                </div>
              ) : (
                <form onSubmit={handleCreateProduct}>
                  <div className="form-group">
                    <label className="form-label">Selecciona la Tienda *</label>
                    <select 
                      className="input-control" 
                      value={prodStoreId} 
                      onChange={(e) => setProdStoreId(e.target.value)}
                      style={{ background: 'var(--bg-secondary)', color: 'white' }}
                      required
                    >
                      <option value="" disabled>Selecciona una tienda aprobada</option>
                      {myStores.filter(s => s.status === 'aprobado').map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre del Producto *</label>
                    <input 
                      type="text" 
                      className="input-control" 
                      value={prodName} 
                      onChange={(e) => setProdName(e.target.value)} 
                      placeholder="Ej. Sombrero de Copa Fino" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descripción *</label>
                    <textarea 
                      className="input-control" 
                      rows={3} 
                      value={prodDesc} 
                      onChange={(e) => setProdDesc(e.target.value)} 
                      placeholder="Detalles sobre materiales, origen, diseño..."
                      required
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label className="form-label">Precio (Bs) *</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="input-control" 
                        value={prodPrice} 
                        onChange={(e) => setProdPrice(e.target.value)} 
                        placeholder="150.00" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Stock Disponible *</label>
                      <input 
                        type="number" 
                        className="input-control" 
                        value={prodStock} 
                        onChange={(e) => setProdStock(e.target.value)} 
                        placeholder="10" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Categoría *</label>
                    <input 
                      type="text" 
                      className="input-control" 
                      value={prodCategory} 
                      onChange={(e) => setProdCategory(e.target.value)} 
                      placeholder="Ej. calzado, ropa, accesorios, tecnologia" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">URL de la Imagen (Opcional)</label>
                    <input 
                      type="url" 
                      className="input-control" 
                      value={prodImage} 
                      onChange={(e) => setProdImage(e.target.value)} 
                      placeholder="https://ejemplo.com/producto.jpg" 
                    />
                  </div>

                  <div style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', background: 'rgba(0,0,0,0.1)' }}>
                    <label className="form-label" style={{ marginBottom: '12px' }}>Atributos Inteligentes (Para Búsqueda IA)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Color (Ej. Negro, Rojo)</label>
                        <input type="text" className="input-control" value={prodColor} onChange={(e) => setProdColor(e.target.value)} placeholder="Negro" />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Talla / Tamaño (Ej. L, M, 42)</label>
                        <input type="text" className="input-control" value={prodSize} onChange={(e) => setProdSize(e.target.value)} placeholder="M" />
                      </div>
                    </div>
                  </div>

                  {/* Configuración de opciones de entrega */}
                  <div style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '25px', background: 'rgba(0,0,0,0.1)' }}>
                    <label className="form-label" style={{ marginBottom: '12px' }}>Opciones de Entrega de Producto</label>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <label className="checkbox-control">
                        <input type="checkbox" checked={prodDelivery} onChange={(e) => setProdDelivery(e.target.checked)} />
                        Permitir Delivery / Envío a Domicilio
                      </label>
                      <label className="checkbox-control">
                        <input type="checkbox" checked={prodPickup} onChange={(e) => setProdPickup(e.target.checked)} />
                        Permitir Recojo en Tienda
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px' }}>Publicar Producto</button>
                </form>
              )}
            </div>
          )}
        </main>
      )}

      {/* --- VISTA: PANEL DE ADMINISTRACIÓN (SOLICITUDES) --- */}
      {activeView === 'admin' && session?.user?.role === 'admin' && (
        <main className="container animate-fade-in" style={{ flex: 1, padding: '40px 0' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '2.2rem' }}>Panel de Aprobaciones</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Gestiona los permisos y aprueba la apertura de tiendas o la publicación de productos.</p>
            </div>
            
            <div className="tabs-container" style={{ margin: 0 }}>
              <button className={`tab-btn ${adminTab === 'stores' ? 'active' : ''}`} onClick={() => setAdminTab('stores')}>
                Tiendas Pendientes ({pendingStores.length})
              </button>
              <button className={`tab-btn ${adminTab === 'products' ? 'active' : ''}`} onClick={() => setAdminTab('products')}>
                Productos Pendientes ({pendingProducts.length})
              </button>
            </div>
          </div>

          {/* SOLICITUDES DE TIENDA */}
          {adminTab === 'stores' && (
            <div>
              {pendingStores.length === 0 ? (
                <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>No hay solicitudes de apertura de tienda pendientes de revisión. 🙌</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {pendingStores.map((store) => (
                    <div key={store.id} className="glass" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px' }}>
                        <img src={store.logo_url} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '50%' }} />
                        <div>
                          <h3 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{store.name}</h3>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            Solicitante: <strong>{store.users?.full_name}</strong> ({store.users?.email})
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{store.description}</p>
                          {store.website && <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>Sitio: {store.website}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                          onClick={() => handleAdminApproval(store.id, 'store', 'aprobado')}
                          className="btn-primary" 
                          style={{ backgroundColor: 'var(--state-approved)', boxShadow: 'none', padding: '10px 20px', fontSize: '0.85rem' }}
                        >
                          <CheckIcon /> Aprobar
                        </button>
                        <button 
                          onClick={() => handleAdminApproval(store.id, 'store', 'rechazado')}
                          className="btn-secondary" 
                          style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '10px 20px', fontSize: '0.85rem' }}
                        >
                          <XIcon /> Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SOLICITUDES DE PRODUCTOS */}
          {adminTab === 'products' && (
            <div>
              {pendingProducts.length === 0 ? (
                <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>No hay solicitudes de publicación de productos pendientes de revisión. 🙌</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {pendingProducts.map((product) => {
                    const devOpts = product.delivery_options || { delivery: true, pickup: true };
                    return (
                      <div key={product.id} className="glass" style={{ padding: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <img src={product.image_url} alt="" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                        
                        <div style={{ flex: 1, minWidth: '250px' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                            🏢 Tienda: {product.stores?.name}
                          </div>
                          <h3 style={{ fontSize: '1.3rem', margin: '4px 0' }}>{product.name}</h3>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Precio: <strong>Bs {product.price}</strong> | Stock: <strong>{product.stock}</strong> | Cat: <strong>{product.category}</strong>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{product.description}</p>
                          
                          {/* Atributos y opciones de entrega */}
                          <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                            <span>🚚 Delivery: {devOpts.delivery ? 'Sí' : 'No'}</span>
                            <span>🏪 Recojo: {devOpts.pickup ? 'Sí' : 'No'}</span>
                            {product.attributes && Object.keys(product.attributes).length > 0 && (
                              <span>✨ Specs: {JSON.stringify(product.attributes)}</span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button 
                            onClick={() => handleAdminApproval(product.id, 'product', 'aprobado')}
                            className="btn-primary" 
                            style={{ backgroundColor: 'var(--state-approved)', boxShadow: 'none', padding: '10px 20px', fontSize: '0.85rem' }}
                          >
                            <CheckIcon /> Aprobar
                          </button>
                          <button 
                            onClick={() => handleAdminApproval(product.id, 'product', 'rechazado')}
                            className="btn-secondary" 
                            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '10px 20px', fontSize: '0.85rem' }}
                          >
                            <XIcon /> Rechazar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* --- PORTAL DE PAGO QR Y RESERVAS (MODAL) --- */}
      {qrModal && (
        <div className="modal-backdrop" onClick={() => setQrModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '30px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.4rem' }}>
                {qrModal.type === 'compra_qr' ? '💳 Pago por QR' : '🏪 Reserva para Recojo'}
              </h3>
              <button onClick={() => setQrModal(null)} style={{ background: 'transparent' }}><XIcon /></button>
            </div>

            {!qrSuccess ? (
              <div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'left', marginBottom: '20px' }}>
                  <img src={qrModal.product.image_url} alt="" style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{qrModal.product.store_name}</div>
                    <h4 style={{ fontSize: '1.1rem', margin: '2px 0' }}>{qrModal.product.name}</h4>
                    <div style={{ fontSize: '0.9rem' }}>Precio unitario: <strong>Bs {qrModal.product.price}</strong></div>
                  </div>
                </div>

                {/* Cantidad Selector */}
                <div className="form-group" style={{ maxWidth: '150px', margin: '0 auto 24px' }}>
                  <label className="form-label" style={{ textAlign: 'center' }}>Cantidad a Solicitar</label>
                  <input 
                    type="number" 
                    className="input-control" 
                    value={orderQuantity} 
                    min={1} 
                    max={qrModal.product.stock}
                    onChange={(e) => setOrderQuantity(Math.min(parseInt(e.target.value) || 1, qrModal.product.stock))}
                    style={{ textAlign: 'center' }}
                  />
                </div>

                <div style={{ fontSize: '1.2rem', marginBottom: '24px' }}>
                  Total a pagar: <strong style={{ color: 'var(--accent-primary)', fontSize: '1.4rem' }}>Bs {parseFloat(qrModal.product.price) * orderQuantity}</strong>
                </div>

                {qrLoading ? (
                  <div style={{ padding: '20px 0' }}>
                    <div className="qr-spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '15px', fontSize: '0.9rem' }}>
                      {qrModal.type === 'compra_qr' ? 'Generando código QR y esperando confirmación de pago bancario...' : 'Procesando tu solicitud de reserva...'}
                    </p>
                  </div>
                ) : qrModal.type === 'compra_qr' ? (
                  <div className="animate-fade-in">
                    <div className="qr-container">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=sucreshop-pay-${qrModal.product.id}-${orderQuantity}-${Date.now()}`} 
                        alt="Simulador QR"
                        className="qr-code-img"
                      />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                      Escanea este código QR con tu aplicación bancaria móvil para realizar el pago inmediato de forma segura.
                    </p>
                    <button onClick={handleConfirmOrder} className="btn-primary" style={{ width: '100%', padding: '14px' }}>
                      Simular Pago Exitoso
                    </button>
                  </div>
                ) : (
                  <button onClick={handleConfirmOrder} className="btn-primary" style={{ width: '100%', padding: '14px' }}>
                    Confirmar Reserva
                  </button>
                )}
              </div>
            ) : (
              <div className="animate-fade-in" style={{ padding: '20px 0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--state-approved)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid var(--state-approved)' }}>
                  <CheckIcon />
                </div>
                <h4 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
                  {qrModal.type === 'compra_qr' ? '¡Pago QR Procesado!' : '¡Reserva Completada!'}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
                  {qrModal.type === 'compra_qr' 
                    ? 'Tu pago ha sido validado correctamente y el vendedor está preparando tu delivery.' 
                    : 'Tu producto ha sido reservado. Visita la tienda con tu nombre para retirar tu pedido y pagar en el local.'}
                </p>
                <button 
                  onClick={() => { setQrModal(null); setActiveView('orders'); }} 
                  className="btn-primary" 
                  style={{ width: '100%' }}
                >
                  Ver mis Compras
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL PARA ESCRIBIR MOTIVO DE RECHAZO DE ADMINISTRADOR --- */}
      {rejectionModal && (
        <div className="modal-backdrop" onClick={() => setRejectionModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Justificación de Rechazo</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Por favor, detalla el motivo de rechazo. Esta información será visible para el vendedor en su panel para que pueda corregir los datos.
            </p>

            <div className="form-group">
              <label className="form-label">Motivo de Rechazo *</label>
              <textarea 
                className="input-control" 
                rows={4} 
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)} 
                placeholder="Ej. El logo de la tienda tiene baja resolución o el precio del producto no coincide con la descripción..."
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectionModal(null)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                Cancelar
              </button>
              <button 
                onClick={() => handleAdminApproval(rejectionModal.id, rejectionModal.type, 'rechazado')} 
                className="btn-primary" 
                style={{ backgroundColor: 'var(--state-rejected)', boxShadow: 'none', padding: '8px 16px', fontSize: '0.9rem' }}
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-color)',
        padding: '30px 20px',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        background: 'rgba(0,0,0,0.1)'
      }}>
        © 2026 SucreShop. Todos los derechos reservados. Diseñado con tecnología de punta y IA en Sucre, Bolivia.
      </footer>
    </div>
  );
}

export default App;
