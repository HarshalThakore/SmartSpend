// Updated categories API endpoint
app.get('/api/categories', ensureAuthenticated, async (req, res) => {
  try {
    console.log('Fetching categories for user:', req.session.userId);
    
    const result = await pool.query(
      'SELECT * FROM categories WHERE user_id = $1 ORDER BY name',
      [req.session.userId]
    );
    
    // If no categories exist yet, create some default ones
    if (result.rows.length === 0) {
      console.log('No categories found, creating defaults for user:', req.session.userId);
      
      // Create default categories
      const defaultCategories = [
        { name: 'Salary', type: 'income', icon: 'wallet' },
        { name: 'Food', type: 'expense', icon: 'utensils' },
        { name: 'Transportation', type: 'expense', icon: 'car' },
        { name: 'Housing', type: 'expense', icon: 'home' },
        { name: 'Entertainment', type: 'expense', icon: 'film' }
      ];
      
      const insertPromises = defaultCategories.map(category => {
        return pool.query(
          'INSERT INTO categories (name, type, icon, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
          [category.name, category.type, category.icon, req.session.userId]
        );
      });
      
      // Wait for all inserts to complete
      const insertResults = await Promise.all(insertPromises);
      
      // Return the newly created categories
      const defaultResult = await pool.query(
        'SELECT * FROM categories WHERE user_id = $1 ORDER BY name',
        [req.session.userId]
      );
      
      console.log('Created default categories:', defaultResult.rows);
      res.status(200).json(defaultResult.rows);
    } else {
      // Return existing categories
      console.log('Returning existing categories:', result.rows);
      res.status(200).json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});
