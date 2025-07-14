import { useState, useEffect } from 'react';
import { productsService, categoriesService } from '../services/api';
import ProductCard from '../components/ProductCard';
import './Home.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (window.bootstrap && document.getElementById('mainCarousel')) {
      new window.bootstrap.Carousel(document.getElementById('mainCarousel'), {
        interval: 3000,
        ride: 'carousel'
      });
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        productsService.getAll(),
        categoriesService.getAll()
      ]);
      
      const productsData = Array.isArray(productsRes.data) ? productsRes.data : [];
      const categoriesData = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
      
      // Obtener cada categoría con sus productos
      const categoriesWithProducts = await Promise.all(
        categoriesData.map(async (category) => {
          try {
            const categoryWithProducts = await categoriesService.getById(category.id);
            return {
              ...category,
              products: categoryWithProducts.data.products || []
            };
          } catch (err) {
            console.error(`Error fetching products for category ${category.id}:`, err);
            return {
              ...category,
              products: []
            };
          }
        })
      );
      
      setProducts(productsData);
      setCategories(categoriesWithProducts);
    } catch (err) {
      setError('Error al cargar los datos');
      setProducts([]);
      setCategories([]);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <h2>Cargando productos...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <h2>Error: {error}</h2>
          <button onClick={fetchData} className="btn">Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="hero">
        <h1>Buffet Escolar</h1>
        <p>Deliciosos productos para estudiantes</p>
      </div>

      {/* Carrusel Bootstrap */}
      <div className="carousel-container" style={{ marginBottom: '2rem', width: '100%' }}>
        <div id="mainCarousel" className="carousel slide" data-bs-ride="carousel">
          <div className="carousel-inner">
            <div className="carousel-item active">
              <img src="/img/slide1.jpg" className="d-block w-100" alt="slide1" style={{ borderRadius: '18px', maxHeight: '320px', objectFit: 'cover' }} />
            </div>
            <div className="carousel-item">
              <img src="/img/slide2.jpg" className="d-block w-100" alt="slide2" style={{ borderRadius: '18px', maxHeight: '320px', objectFit: 'cover' }} />
            </div>
            <div className="carousel-item">
              <img src="/img/slide3.jpg" className="d-block w-100" alt="slide3" style={{ borderRadius: '18px', maxHeight: '320px', objectFit: 'cover' }} />
            </div>
          </div>
          <button className="carousel-control-prev" type="button" data-bs-target="#mainCarousel" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Anterior</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#mainCarousel" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Siguiente</span>
          </button>
        </div>
      </div>

      {/* Mostrar categorías con sus productos */}
      {Array.isArray(categories) && categories.length > 0 ? (
        <div className="category-section-list">
          <h2>Nuestras Secciones</h2>
          <div className="categories-list">
            {categories.map(category => (
              <div key={category.id} className="category-section">
                <div className="category-header">
                  <h3>{category.name}</h3>
                  {category.description && <p className="category-description">{category.description}</p>}
                </div>
                
                {category.products && category.products.length > 0 ? (
                  <div className="category-products">
                    <div className="products-grid-horizontal">
                      {category.products.map(product => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="category-empty">
                    <p>No hay productos en esta sección</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="category-section-list">
          <h2>Nuestras Secciones</h2>
          <p>No hay categorías disponibles.</p>
        </div>
      )}

      {/* Mostrar productos sin categoría */}
      <section className="products-section">
        <h2>Otros Productos</h2>
        <div className="products-grid-horizontal">
          {(Array.isArray(products) ? products : []).filter(product => product.isActive && !categories.some(cat => cat.products.some(p => p.id === product.id))).length > 0 ? (
            products.filter(product => product.isActive && !categories.some(cat => cat.products.some(p => p.id === product.id))).map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <p>No hay productos sin categoría.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home; 