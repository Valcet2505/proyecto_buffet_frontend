import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Obtener cantidad de items en el carrito
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    };

    updateCartCount();

    // Escuchar cambios en el localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === 'cart') {
        updateCartCount();
      }
    });
    
    // Escuchar eventos personalizados para cambios en el mismo tab
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          🍽️ Buffet Escolar
        </Link>
        
        <div className="navbar-menu">
          <Link to="/" className="nav-link">Inicio</Link>
          
          {user && (
            <>
              <Link to="/cart" className="nav-link cart-link">
                🛒 Carrito
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="nav-link">Administración</Link>
              )}
            </>
          )}
        </div>
        
        <div className="navbar-auth">
          {user ? (
            <div className="user-menu">
              <span className="user-name">Hola, {user.name}</span>
              <button onClick={handleLogout} className="btn btn-secondary">
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn">
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 