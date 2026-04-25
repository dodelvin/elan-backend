/**
 * controllers/shop.controller.ts
 * ------------------------------
 * Shop catalog reads come from Firestore "products" collection.
 *
 * Contains:
 *   - getProducts()   list of products (optionally filtered by category)
 */

import { Request, Response } from 'express';
import { getDb, isFirebaseReady } from '../config/firebase.js';

/**
 * getProducts
 * Optional ?category=Fitness query param filters by category server-side.
 */
export async function getProducts(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const category = (req.query.category as string) || 'All';
  const ref = getDb().collection('products');

  const snapshot = category === 'All'
    ? await ref.get()
    : await ref.where('category', '==', category).get();

  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json({ products, category });
}
