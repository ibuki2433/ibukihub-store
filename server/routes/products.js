import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Get all categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.getCategories() || [];
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all products
router.get('/', (req, res) => {
  try {
    const { category, search } = req.query;
    let products = db.getProducts() || [];
    let categories = [];
    try {
      categories = (typeof db.getCategories === 'function' ? db.getCategories() : db.data?.categories) || [];
    } catch (_) {
      categories = (db.data && db.data.categories) || [];
    }

    if (category && category !== 'all') {
      products = products.filter(p => p.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      const normQ = q.replace(/[\s\.\-_]/g, '');
      products = products.filter(p => {
        const name = (p.name || '').toLowerCase();
        const normName = name.replace(/[\s\.\-_]/g, '');
        const shortDesc = (p.shortDesc || '').toLowerCase();
        const badge = (p.badge || '').toLowerCase();
        const version = (p.version || '').toLowerCase();
        return (
          name.includes(q) ||
          normName.includes(normQ) ||
          shortDesc.includes(q) ||
          badge.includes(q) ||
          version.includes(q)
        );
      });
    }

    res.json({ success: true, products, categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product
router.get('/:id', (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "ไม่พบสินค้าที่ต้องการ" });
    }
    const keyStock = db.getLicenseKeyStock(product.id);
    res.json({ success: true, product: { ...product, keyStock } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
