import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Get all products
router.get('/', (req, res) => {
  try {
    const { category, search } = req.query;
    let products = db.getProducts();

    if (category && category !== 'all') {
      products = products.filter(p => p.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.shortDesc && p.shortDesc.toLowerCase().includes(q)) ||
        (p.badge && p.badge.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, products });
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
