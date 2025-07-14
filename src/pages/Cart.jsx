import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersService, paymentService } from '../services/api';
import './Cart.css';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cart.map(item => 
      item.id === productId 
        ? { ...item, quantity: Math.min(newQuantity, item.stock) }
        : item
    );
    
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Crear el pedido
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total: getTotal(),
        userId: user.id
      };

      console.log('Creating order with data:', orderData);
      const orderResponse = await ordersService.create(orderData);
      console.log('Order created:', orderResponse.data);
      
      // Crear preferencia de pago
      console.log('Creating payment preference for order:', orderResponse.data.orderId);
      const paymentResponse = await paymentService.createPreference(orderResponse.data.orderId);
      console.log('Payment preference created:', paymentResponse.data);
      
      // Limpiar carrito
      localStorage.removeItem('cart');
      setCart([]);
      
      // Redirigir a Mercado Pago
      window.location.href = paymentResponse.data.paymentUrl;
      
    } catch (err) {
      console.error('Error during checkout:', err);
      setError(err.response?.data?.error || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container">
        <div className="empty-cart">
          <h2>Tu carrito está vacío</h2>
          <p>Agrega algunos productos para comenzar</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Ver Productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>🛒 Carrito de Compras</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="cart-content">
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <div className="item-image">
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div className="product-placeholder">
                    <span>🍽️</span>
                    <p>{item.name}</p>
                  </div>
                )}
              </div>
              
              <div className="item-details">
                <h3>{item.name}</h3>
                <p className="item-description">{item.description}</p>
                <p className="item-price">${item.price} c/u</p>
              </div>
              
              <div className="item-quantity">
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="quantity-btn"
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className="quantity-btn"
                >
                  +
                </button>
              </div>
              
              <div className="item-total">
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
              
              <button 
                onClick={() => removeItem(item.id)}
                className="btn btn-danger remove-btn"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
        
        <div className="cart-summary">
          <h3>Resumen del Pedido</h3>
          <div className="summary-item">
            <span>Subtotal:</span>
            <span>${getTotal().toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span>Total:</span>
            <span className="total-price">${getTotal().toFixed(2)}</span>
          </div>
          
          <button 
            onClick={handleCheckout}
            disabled={loading}
            className="btn btn-success checkout-btn"
          >
            {loading ? 'Procesando...' : 'Proceder al Pago'}
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="btn btn-secondary continue-btn"
          >
            Continuar Comprando
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart; 