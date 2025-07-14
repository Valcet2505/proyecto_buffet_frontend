import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersService, categoriesService, productsService } from '../services/api';
import './Admin.css';

const Admin = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para categorías
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });
  
  // Estados para productos
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  // Estado inicial de productForm alineado con el modelo sin 'type'
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    stock: '',
    description: '',
    image: '',
    isActive: true
  });
  
  // Estado para mostrar productos de categoría
  const [showCategoryProductsModal, setShowCategoryProductsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  
  // Estado para productos seleccionados en la categoría
  const [categoryProductIds, setCategoryProductIds] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si el usuario es admin
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, categoriesRes] = await Promise.all([
        ordersService.getAll(),
        categoriesService.getAll()
      ]);
      // Obtener todos los productos (activos e inactivos)
      const productsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/products`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      let productsData = [];
      try {
        productsData = await productsRes.json();
      } catch (e) {
        productsData = [];
      }
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
    } catch (err) {
      setError('Error al cargar los datos');
      setOrders([]);
      setProducts([]);
      setCategories([]);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await ordersService.updateStatus(orderId, status);
      fetchData(); // Recargar datos
    } catch (err) {
      // No alert, simplemente no hacer nada
    }
  };

  // Funciones para categorías
  const openCategoryModal = async (category = null) => {
    // Obtener todos los productos
    const res = await categoriesService.getAll();
    setAllProducts(res.data);

    if (category) {
      // Obtener la categoría actualizada del backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/categories/${category.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const categoryData = await response.json();
      setEditingCategory(categoryData);
      setCategoryForm({
        name: categoryData.name,
        description: categoryData.description || ''
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: ''
      });
    }
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: ''
    });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    
    if (!categoryForm.name.trim()) {
      // No alert, simplemente no hacer nada
      return;
    }

    try {
      if (editingCategory) {
        await categoriesService.update(editingCategory.id, {
          name: categoryForm.name,
          description: categoryForm.description
        });
        // No alert, simplemente no hacer nada
      } else {
        await categoriesService.create({
          name: categoryForm.name,
          description: categoryForm.description
        });
        // No alert, simplemente no hacer nada
      }
      
      closeCategoryModal();
      fetchData(); // Recargar datos
    } catch (err) {
      // No alert, simplemente no hacer nada
    }
  };

  const handleCategoryDelete = async (categoryId) => {
    // No confirm, simplemente no hacer nada
    // No alert, simplemente no hacer nada
    try {
      await categoriesService.delete(categoryId);
      // No alert, simplemente no hacer nada
      fetchData(); // Recargar datos
    } catch (err) {
      // No alert, simplemente no hacer nada
    }
  };

  // Funciones para productos
  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        description: product.description || '',
        image: product.image || '',
        isActive: product.isActive
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        price: '',
        stock: '',
        description: '',
        image: '',
        isActive: true
      });
    }
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setProductForm({
      name: '',
      price: '',
      stock: '',
      description: '',
      image: '',
      isActive: true
    });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    if (!productForm.name.trim() || !productForm.price || !productForm.stock) {
      // No alert, simplemente no hacer nada
      return;
    }

    if (isNaN(parseFloat(productForm.price)) || parseFloat(productForm.price) <= 0) {
      // No alert, simplemente no hacer nada
      return;
    }

    if (isNaN(parseInt(productForm.stock)) || parseInt(productForm.stock) < 0) {
      // No alert, simplemente no hacer nada
      return;
    }

    try {
      const productData = {
        name: productForm.name.trim(),
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        description: productForm.description?.trim() || undefined,
        image: productForm.image?.trim() || undefined,
        isActive: productForm.isActive
      };

      if (editingProduct) {
        await productsService.update(editingProduct.id, productData);
      } else {
        await productsService.create(productData);
      }
      
      closeProductModal();
      fetchData(); // Recargar datos
    } catch (err) {
      // No alert, simplemente no hacer nada
    }
  };

  const handleProductDelete = async (productId) => {
    // No confirm, simplemente no hacer nada
    try {
      await productsService.delete(productId);
      fetchData(); // Recargar datos
    } catch (err) {
      // No alert, simplemente no hacer nada
    }
  };

  const handleProductToggleStatus = async (productId, currentStatus) => {
    try {
      await productsService.update(productId, { isActive: !currentStatus });
      fetchData(); // Recargar datos
    } catch (err) {
      // No alert, simplemente no hacer nada
    }
  };

  // Función para mostrar productos de una categoría
  const showCategoryProducts = async (category) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/categories/${category.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const categoryData = await response.json();
      
      setSelectedCategory(category);
      setCategoryProducts(categoryData.products || []);
      setShowCategoryProductsModal(true);
    } catch (err) {
      // No alert, simplemente no hacer nada
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { class: 'status-pending', text: 'Pendiente' },
      PREPARING: { class: 'status-preparing', text: 'Preparando' },
      READY: { class: 'status-ready', text: 'Listo' },
      COMPLETED: { class: 'status-completed', text: 'Completado' },
      CANCELLED: { class: 'status-cancelled', text: 'Cancelado' },
    };
    
    const config = statusConfig[status] || { class: 'status-pending', text: status };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  // Handler genérico para los inputs del formulario de productos
  const handleProductFormChange = (e) => {
    const { name, value, type } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? e.target.checked : value
    }));
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <h2>Cargando panel de administración...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Panel de Administración</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Pedidos ({orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Productos
        </button>
        <button className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>Categorías</button>
      </div>

      {activeTab === 'orders' && (
        <div className="admin-section">
          <h2>Gestión de Pedidos</h2>
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.orderNumber}</td>
                    <td>{order.user?.name || 'N/A'}</td>
                    <td>
                      {order.orderItems.map(item => (
                        <div key={item.id}>
                          {item.quantity}x {item.product.name}
                        </div>
                      ))}
                    </td>
                    <td>${order.total}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                    <td>
                      <div className="action-buttons">
                        {order.status === 'PENDING' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                            className="btn btn-primary btn-sm"
                          >
                            Preparar
                          </button>
                        )}
                        {order.status === 'PREPARING' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'READY')}
                            className="btn btn-success btn-sm"
                          >
                            Listo
                          </button>
                        )}
                        {order.status === 'READY' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                            className="btn btn-primary btn-sm"
                          >
                            Entregado
                          </button>
                        )}
                        {(order.status === 'PENDING' || order.status === 'PREPARING') && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                            className="btn btn-danger btn-sm"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="admin-section">
          <h2>Gestión de Productos</h2>
          <button className="btn btn-primary" onClick={() => openProductModal()}>+ Nuevo Producto</button>
          <div className="products-table">
            <table>
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(products) ? products : []).map(product => (
                  <tr key={product.id}>
                    <td>
                      <img 
                        src={product.image || 'https://via.placeholder.com/50x50'} 
                        alt={product.name}
                        className="product-thumb"
                      />
                    </td>
                    <td>{product.name}</td>
                    <td>${product.price}</td>
                    <td>
                      <span className={`stock-badge ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${product.isActive ? 'status-active' : 'status-inactive'}`}>
                        {product.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-primary btn-sm" onClick={() => openProductModal(product)}>Editar</button>
                        <button 
                          className="btn btn-warning btn-sm" 
                          onClick={() => handleProductToggleStatus(product.id, product.isActive)}
                        >
                          {product.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleProductDelete(product.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <CategorySection onRefresh={fetchData} />
      )}

      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
            <form onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label>Nombre:</label>
                <input 
                  type="text" 
                  name="name" 
                  value={categoryForm.name} 
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} 
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea 
                  name="description" 
                  value={categoryForm.description} 
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} 
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">{editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}</button>
                <button type="button" className="btn btn-secondary" onClick={closeCategoryModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  name="name"
                  value={productForm.name}
                  onChange={handleProductFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio:</label>
                <input
                  type="number"
                  name="price"
                  value={productForm.price}
                  onChange={handleProductFormChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Stock:</label>
                <input
                  type="number"
                  name="stock"
                  value={productForm.stock}
                  onChange={handleProductFormChange}
                  required
                  min="0"
                  step="1"
                />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  name="description"
                  value={productForm.description}
                  onChange={handleProductFormChange}
                />
              </div>
              <div className="form-group">
                <label>Imagen (URL):</label>
                <input
                  type="url"
                  name="image"
                  value={productForm.image}
                  onChange={handleProductFormChange}
                />
              </div>
              <div className="form-group">
                <label>Estado:</label>
                <select
                  name="isActive"
                  value={productForm.isActive ? 'true' : 'false'}
                  onChange={e => setProductForm({ ...productForm, isActive: e.target.value === 'true' })}
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">{editingProduct ? 'Guardar Cambios' : 'Crear Producto'}</button>
                <button type="button" className="btn btn-secondary" onClick={closeProductModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para mostrar productos de una categoría */}
      {showCategoryProductsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Productos de: {selectedCategory?.name}</h2>
            <div className="category-products-list">
              {categoryProducts.length > 0 ? (
                <div className="products-grid">
                  {categoryProducts.map(product => (
                    <div key={product.id} className="product-item">
                      <img 
                        src={product.image || 'https://via.placeholder.com/100x100'} 
                        alt={product.name}
                        className="product-thumb"
                      />
                      <div className="product-info">
                        <h4>{product.name}</h4>
                        <p>${product.price}</p>
                        <p>Stock: {product.stock}</p>
                        <span className={`status-badge ${product.isActive ? 'status-active' : 'status-inactive'}`}>
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No hay productos en esta categoría</p>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryProductsModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SECCIÓN SIMPLE DE CATEGORÍAS

const CategorySection = ({ onRefresh }) => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const catRes = await categoriesService.getAll();
    setCategories(catRes.data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      // No alert, simplemente no hacer nada
      return;
    }
    setLoading(true);
    try {
      if (editing) {
        await categoriesService.update(editing.id, {
          name: form.name,
          description: form.description
        });
        // No alert, simplemente no hacer nada
      } else {
        await categoriesService.create({
          name: form.name,
          description: form.description
        });
        // No alert, simplemente no hacer nada
      }
      setForm({ name: '', description: '' });
      setEditing(null);
      fetchData();
      if (onRefresh) onRefresh();
    } catch (err) {
      // No alert, simplemente no hacer nada
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description || ''
    });
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
  };

  const handleManageProducts = async (category) => {
    try {
      // Obtener todos los productos
      const productsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/products`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const allProductsData = await productsRes.json();
      setAllProducts(Array.isArray(allProductsData) ? allProductsData : []);

      // Obtener la categoría con sus productos
      const categoryRes = await categoriesService.getById(category.id);
      setCategoryProducts(categoryRes.data.products || []);
      setSelectedCategory(category);
      setShowProductModal(true);
    } catch (err) {
      // No alert, simplemente no hacer nada
    }
  };

  const handleAddProductsToCategory = async (specificProductIds = null) => {
    let productIds;
    
    if (specificProductIds) {
      // Agregar productos específicos
      productIds = specificProductIds;
    } else {
      // Agregar todos los productos disponibles
      const selectedProducts = allProducts.filter(product => 
        !categoryProducts.some(cp => cp.id === product.id) && product.isActive
      );
      
      if (selectedProducts.length === 0) {
        // No alert, simplemente no hacer nada
        return;
      }
      
      productIds = selectedProducts.map(p => p.id);
    }
    
    try {
      await categoriesService.addProducts(selectedCategory.id, productIds);
      // No alert, simplemente no hacer nada
      handleManageProducts(selectedCategory); // Recargar
    } catch (err) {
      // No alert, simplemente no hacer nada
    }
  };

  const handleRemoveProductsFromCategory = async (productIds) => {
    try {
      await categoriesService.removeProducts(selectedCategory.id, productIds);
      // No alert, simplemente no hacer nada
      handleManageProducts(selectedCategory); // Recargar
    } catch (err) {
      // No alert, simplemente no hacer nada
    }
  };

  const handleDelete = async (category) => {
    // No confirm, simplemente no hacer nada
    setLoading(true);
    try {
      await categoriesService.delete(category.id);
      // No alert, simplemente no hacer nada
      fetchData();
      if (onRefresh) onRefresh();
    } catch (err) {
      // No alert, simplemente no hacer nada
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-section">
      <h2>Categorías</h2>
      <button className="btn btn-primary" onClick={() => { setShowAddModal(true); setEditing(null); setForm({ name: '', description: '' }); }}>
        + Nueva Categoría
      </button>
      <div className="categories-table">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.description || 'Sin descripción'}</td>
                <td>
                  <button className="btn btn-primary btn-sm" onClick={() => handleEdit(category)}>Editar</button>
                  <button className="btn btn-success btn-sm" onClick={() => handleManageProducts(category)}>Gestionar Productos</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(category)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="custom-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="custom-modal-content animate-in" onClick={e => e.stopPropagation()}>
            <h2>Nueva Categoría</h2>
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-group">
                <label>Nombre:</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} required autoFocus />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea name="description" value={form.description} onChange={handleChange} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>Crear Categoría</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para gestionar productos de categoría */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Gestionar Productos: {selectedCategory?.name}</h2>
            
            <div className="category-products-management">
              <div className="products-section">
                <h3>Productos en esta categoría ({categoryProducts.length})</h3>
                {categoryProducts.length > 0 ? (
                  <div className="products-grid">
                    {categoryProducts.map(product => (
                      <div key={product.id} className="product-item">
                        <img 
                          src={product.image || 'https://via.placeholder.com/50x50'} 
                          alt={product.name}
                          className="product-thumb"
                        />
                        <div className="product-info">
                          <h4>{product.name}</h4>
                          <p>${product.price}</p>
                        </div>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveProductsFromCategory([product.id])}
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No hay productos en esta categoría</p>
                )}
              </div>

              <div className="products-section">
                <h3>Productos disponibles para agregar</h3>
                <button 
                  className="btn btn-success"
                  onClick={handleAddProductsToCategory}
                >
                  Agregar todos los productos disponibles
                </button>
                <div className="products-grid">
                  {allProducts
                    .filter(product => !categoryProducts.some(cp => cp.id === product.id) && product.isActive)
                    .map(product => (
                      <div key={product.id} className="product-item">
                        <img 
                          src={product.image || 'https://via.placeholder.com/50x50'} 
                          alt={product.name}
                          className="product-thumb"
                        />
                        <div className="product-info">
                          <h4>{product.name}</h4>
                          <p>${product.price}</p>
                        </div>
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleAddProductsToCategory([product.id])}
                        >
                          Agregar
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowProductModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin; 