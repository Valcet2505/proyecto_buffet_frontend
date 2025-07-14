import { useState } from 'react';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const [quantity, setQuantity] = useState(1);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity <= product.stock) {
        existingItem.quantity = newQuantity;
      } else {
        return;
      }
    } else {
      if (quantity <= product.stock) {
        cart.push({ ...product, quantity });
      } else {
        return;
      }
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    // Disparar evento para actualizar el contador del carrito
    window.dispatchEvent(new Event('cartUpdated'));
    setQuantity(1);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className="product-card">
      <div className="product-image">
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <div className="product-placeholder">
            <span>🍽️</span>
            <p>{product.name}</p>
          </div>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-price">
          <span className="price">${product.price}</span>
          <span className="stock">Stock: {product.stock}</span>
        </div>
        {product.stock > 0 ? (
          <div className="product-actions">
            <div className="quantity-controls">
              <button 
                onClick={() => handleQuantityChange(quantity - 1)} 
                disabled={quantity <= 1} 
                className="quantity-btn"
              >
                -
              </button>
              <span className="quantity">{quantity}</span>
              <button 
                onClick={() => handleQuantityChange(quantity + 1)} 
                disabled={quantity >= product.stock} 
                className="quantity-btn"
              >
                +
              </button>
            </div>
            <button onClick={addToCart} className="add-to-cart-btn">
              Agregar al Carrito
            </button>
          </div>
        ) : (
          <div className="out-of-stock">Sin stock disponible</div>
        )}
      </div>
    </div>
  );
};

export default ProductCard; 