import mysql from 'mysql2/promise';

class MySQLDatabase {
  constructor() {
    this.pool = null;
    this.connected = false;
    this.config = {
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'ibukihub_store',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    };
  }

  async connect() {
    try {
      // First connect without database to ensure database exists
      const bootstrapConn = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        charset: 'utf8mb4'
      });

      await bootstrapConn.query(`CREATE DATABASE IF NOT EXISTS \`${this.config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await bootstrapConn.end();

      // Now create connection pool with the database
      this.pool = mysql.createPool(this.config);

      // Verify connection
      const [rows] = await this.pool.query('SELECT 1 + 1 AS test');
      this.connected = true;
      console.log(`[MySQL] Connected successfully to ${this.config.host}:${this.config.port}/${this.config.database}`);

      // Initialize all required tables
      await this.initTables();
      return true;
    } catch (err) {
      this.connected = false;
      console.warn(`[MySQL] Connection unavailable (${err.message}). Running in JSON file fallback mode.`);
      return false;
    }
  }

  async initTables() {
    if (!this.connected || !this.pool) return;

    try {
      // 1. Users table (ลูกค้า & สมาชิก)
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS \`users\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`username\` VARCHAR(100) NOT NULL UNIQUE,
          \`email\` VARCHAR(191) NOT NULL UNIQUE,
          \`password\` VARCHAR(255) NOT NULL,
          \`display_name\` VARCHAR(150) DEFAULT NULL,
          \`role\` VARCHAR(20) NOT NULL DEFAULT 'member',
          \`balance\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
          \`phone\` VARCHAR(50) DEFAULT '',
          \`is_root_admin\` TINYINT(1) NOT NULL DEFAULT 0,
          \`created_at\` VARCHAR(50) DEFAULT NULL,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_role (\`role\`),
          INDEX idx_created (\`created_at\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 2. Products table (ซอฟต์แวร์)
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS \`products\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`category\` VARCHAR(100) DEFAULT 'general',
          \`price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          \`original_price\` DECIMAL(10, 2) DEFAULT 0.00,
          \`badge\` VARCHAR(100) DEFAULT NULL,
          \`version\` VARCHAR(100) DEFAULT NULL,
          \`short_desc\` TEXT,
          \`description\` LONGTEXT,
          \`system_requirements\` TEXT,
          \`file_name\` VARCHAR(255) DEFAULT NULL,
          \`file_size\` VARCHAR(50) DEFAULT NULL,
          \`download_url\` VARCHAR(500) DEFAULT NULL,
          \`image_url\` VARCHAR(500) DEFAULT NULL,
          \`preview_url\` VARCHAR(500) DEFAULT NULL,
          \`rating\` DECIMAL(3, 1) DEFAULT 5.0,
          \`reviews_count\` INT DEFAULT 0,
          \`sold_count\` INT DEFAULT 0,
          \`stock\` VARCHAR(50) DEFAULT 'ไม่จำกัด',
          \`unlimited_stock\` TINYINT(1) DEFAULT 1,
          \`requires_machine_id\` TINYINT(1) DEFAULT 0,
          \`requires_key\` TINYINT(1) DEFAULT 0,
          \`plans_json\` LONGTEXT,
          \`features_json\` LONGTEXT,
          \`created_at\` VARCHAR(50) DEFAULT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 3. Orders table (สินค้าที่ลูกค้าซื้อไป)
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS \`orders\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`user_id\` VARCHAR(100) NOT NULL,
          \`username\` VARCHAR(100) NOT NULL,
          \`product_id\` VARCHAR(100) NOT NULL,
          \`product_name\` VARCHAR(255) NOT NULL,
          \`plan_id\` VARCHAR(50) DEFAULT NULL,
          \`plan_name\` VARCHAR(150) DEFAULT NULL,
          \`plan_code\` VARCHAR(50) DEFAULT NULL,
          \`duration_days\` INT DEFAULT NULL,
          \`is_lifetime\` TINYINT(1) DEFAULT 1,
          \`expires_at\` VARCHAR(100) DEFAULT 'LIFETIME',
          \`price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          \`license_key\` VARCHAR(255) DEFAULT NULL,
          \`machine_id\` VARCHAR(255) DEFAULT NULL,
          \`license_status\` VARCHAR(50) DEFAULT 'active',
          \`source\` VARCHAR(50) DEFAULT 'web_store',
          \`file_name\` VARCHAR(255) DEFAULT NULL,
          \`file_size\` VARCHAR(50) DEFAULT NULL,
          \`download_url\` VARCHAR(500) DEFAULT NULL,
          \`status\` VARCHAR(50) DEFAULT 'completed',
          \`created_at\` VARCHAR(50) DEFAULT NULL,
          INDEX idx_user_id (\`user_id\`),
          INDEX idx_product_id (\`product_id\`),
          INDEX idx_created (\`created_at\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 4. Topups table (เงินที่ลูกค้าเติมไว้)
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS \`topups\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`user_id\` VARCHAR(100) NOT NULL,
          \`username\` VARCHAR(100) NOT NULL,
          \`amount\` DECIMAL(10, 2) NOT NULL,
          \`channel\` VARCHAR(100) NOT NULL,
          \`sender_name\` VARCHAR(150) DEFAULT '',
          \`message\` TEXT DEFAULT NULL,
          \`voucher_code\` VARCHAR(500) DEFAULT NULL,
          \`status\` VARCHAR(50) DEFAULT 'approved',
          \`created_at\` VARCHAR(50) DEFAULT NULL,
          INDEX idx_user_id (\`user_id\`),
          INDEX idx_channel (\`channel\`),
          INDEX idx_created (\`created_at\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 5. Promo Codes table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS \`promo_codes\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`code\` VARCHAR(100) NOT NULL UNIQUE,
          \`reward_amount\` DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
          \`description\` VARCHAR(255) DEFAULT '',
          \`max_uses\` INT DEFAULT 999999,
          \`used_count\` INT DEFAULT 0,
          \`active\` TINYINT(1) DEFAULT 1,
          \`created_at\` VARCHAR(50) DEFAULT NULL,
          \`expires_at\` VARCHAR(50) DEFAULT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 6. Redeem History table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS \`redeem_history\` (
          \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
          \`promo_id\` VARCHAR(100) NOT NULL,
          \`code\` VARCHAR(100) NOT NULL,
          \`user_id\` VARCHAR(100) NOT NULL,
          \`username\` VARCHAR(100) NOT NULL,
          \`reward_amount\` DECIMAL(10, 2) NOT NULL,
          \`redeemed_at\` VARCHAR(50) DEFAULT NULL,
          INDEX idx_code (\`code\`),
          INDEX idx_user_id (\`user_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      console.log('[MySQL] Database tables checked/initialized successfully.');
    } catch (err) {
      console.error('[MySQL] Table initialization error:', err.message);
    }
  }

  // Helper method to convert snake_case SQL row to camelCase JS object for User
  _mapUser(row) {
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      displayName: row.display_name || row.username,
      role: row.role,
      balance: parseFloat(row.balance) || 0,
      phone: row.phone || '',
      isRootAdmin: Boolean(row.is_root_admin),
      createdAt: row.created_at
    };
  }

  // Helper method for Order
  _mapOrder(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      username: row.username,
      productId: row.product_id,
      productName: row.product_name,
      planId: row.plan_id,
      planName: row.plan_name,
      planCode: row.plan_code,
      durationDays: row.duration_days,
      isLifetime: Boolean(row.is_lifetime),
      expiresAt: row.expires_at,
      price: parseFloat(row.price) || 0,
      licenseKey: row.license_key,
      machineId: row.machine_id,
      licenseStatus: row.license_status,
      source: row.source,
      fileName: row.file_name,
      fileSize: row.file_size,
      downloadUrl: row.download_url,
      status: row.status,
      createdAt: row.created_at
    };
  }

  // Helper method for Topup
  _mapTopup(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      username: row.username,
      amount: parseFloat(row.amount) || 0,
      channel: row.channel,
      senderName: row.sender_name,
      message: row.message,
      voucherCode: row.voucher_code,
      status: row.status,
      createdAt: row.created_at
    };
  }

  // Helper method for PromoCode
  _mapPromo(row) {
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      rewardAmount: parseFloat(row.reward_amount) || 0,
      description: row.description,
      maxUses: row.max_uses,
      usedCount: row.used_count,
      active: Boolean(row.active),
      createdAt: row.created_at,
      expiresAt: row.expires_at
    };
  }

  // ================= USERS =================
  async getUserById(id) {
    if (!this.connected) return null;
    try {
      const [rows] = await this.pool.query('SELECT * FROM users WHERE id = ?', [id]);
      return rows.length ? this._mapUser(rows[0]) : null;
    } catch (err) {
      console.error('[MySQL] getUserById error:', err.message);
      return null;
    }
  }

  async getUserByUsername(username) {
    if (!this.connected) return null;
    try {
      const [rows] = await this.pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username]);
      return rows.length ? this._mapUser(rows[0]) : null;
    } catch (err) {
      console.error('[MySQL] getUserByUsername error:', err.message);
      return null;
    }
  }

  async getUserByEmail(email) {
    if (!this.connected) return null;
    try {
      const [rows] = await this.pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      return rows.length ? this._mapUser(rows[0]) : null;
    } catch (err) {
      console.error('[MySQL] getUserByEmail error:', err.message);
      return null;
    }
  }

  async getAllUsers() {
    if (!this.connected) return [];
    try {
      const [rows] = await this.pool.query('SELECT * FROM users ORDER BY created_at ASC');
      return rows.map(r => this._mapUser(r));
    } catch (err) {
      console.error('[MySQL] getAllUsers error:', err.message);
      return [];
    }
  }

  async upsertUser(user) {
    if (!this.connected) return null;
    try {
      await this.pool.query(`
        INSERT INTO users (id, username, email, password, display_name, role, balance, phone, is_root_admin, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          username = VALUES(username),
          email = VALUES(email),
          password = VALUES(password),
          display_name = VALUES(display_name),
          role = VALUES(role),
          balance = VALUES(balance),
          phone = VALUES(phone),
          is_root_admin = VALUES(is_root_admin)
      `, [
        user.id,
        user.username,
        user.email,
        user.password,
        user.displayName || user.username,
        user.role || 'member',
        user.balance || 0,
        user.phone || '',
        user.isRootAdmin ? 1 : 0,
        user.createdAt || new Date().toISOString()
      ]);
      return user;
    } catch (err) {
      console.error('[MySQL] upsertUser error:', err.message);
      return null;
    }
  }

  async updateUserBalance(userId, balance) {
    if (!this.connected) return false;
    try {
      await this.pool.query('UPDATE users SET balance = ? WHERE id = ?', [balance, userId]);
      return true;
    } catch (err) {
      console.error('[MySQL] updateUserBalance error:', err.message);
      return false;
    }
  }

  async deleteUser(userId) {
    if (!this.connected) return false;
    try {
      await this.pool.query('DELETE FROM users WHERE id = ?', [userId]);
      return true;
    } catch (err) {
      console.error('[MySQL] deleteUser error:', err.message);
      return false;
    }
  }

  // Deprecated: No-op to preserve all customer accounts
  async resetUsersToAdminOnly(adminUser) {
    if (!this.connected) return;
    if (adminUser) await this.upsertUser(adminUser);
  }

  // ================= ORDERS (สินค้าลูกค้าซื้อไป) =================
  async createOrder(order) {
    if (!this.connected) return null;
    try {
      await this.pool.query(`
        INSERT INTO orders (
          id, user_id, username, product_id, product_name,
          plan_id, plan_name, plan_code, duration_days, is_lifetime,
          expires_at, price, license_key, machine_id, license_status,
          source, file_name, file_size, download_url, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          license_key = VALUES(license_key),
          machine_id = VALUES(machine_id)
      `, [
        order.id,
        order.userId,
        order.username,
        order.productId,
        order.productName,
        order.planId || null,
        order.planName || null,
        order.planCode || null,
        order.durationDays || null,
        order.isLifetime ? 1 : 0,
        order.expiresAt || 'LIFETIME',
        order.price || 0,
        order.licenseKey || null,
        order.machineId || null,
        order.licenseStatus || 'active',
        order.source || 'web_store',
        order.fileName || null,
        order.fileSize || null,
        order.downloadUrl || null,
        order.status || 'completed',
        order.createdAt || new Date().toISOString()
      ]);
      return order;
    } catch (err) {
      console.error('[MySQL] createOrder error:', err.message);
      return null;
    }
  }

  async getAllOrders() {
    if (!this.connected) return [];
    try {
      const [rows] = await this.pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      return rows.map(r => this._mapOrder(r));
    } catch (err) {
      console.error('[MySQL] getAllOrders error:', err.message);
      return [];
    }
  }

  async getOrdersByUserId(userId) {
    if (!this.connected) return [];
    try {
      const [rows] = await this.pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
      return rows.map(r => this._mapOrder(r));
    } catch (err) {
      console.error('[MySQL] getOrdersByUserId error:', err.message);
      return [];
    }
  }

  // Deprecated: No-op to preserve customer orders
  async resetOrdersToAdminOnly(adminUserId) {
    return;
  }

  // ================= TOPUPS (เงินที่ลูกค้าเติมไว้) =================
  async recordTopup(topup) {
    return this.createTopup(topup);
  }

  async createTopup(topup) {
    if (!this.connected) return null;
    try {
      await this.pool.query(`
        INSERT INTO topups (
          id, user_id, username, amount, channel, sender_name, message, voucher_code, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status)
      `, [
        topup.id,
        topup.userId,
        topup.username,
        topup.amount || 0,
        topup.channel,
        topup.senderName || '',
        topup.message || '',
        topup.voucherCode || null,
        topup.status || 'approved',
        topup.createdAt || new Date().toISOString()
      ]);
      return topup;
    } catch (err) {
      console.error('[MySQL] createTopup error:', err.message);
      return null;
    }
  }

  async getAllTopups() {
    if (!this.connected) return [];
    try {
      const [rows] = await this.pool.query('SELECT * FROM topups ORDER BY created_at DESC');
      return rows.map(r => this._mapTopup(r));
    } catch (err) {
      console.error('[MySQL] getAllTopups error:', err.message);
      return [];
    }
  }

  async updateTopupStatus(topupId, status) {
    if (!this.connected) return false;
    try {
      await this.pool.query('UPDATE topups SET status = ? WHERE id = ?', [status, topupId]);
      return true;
    } catch (err) {
      console.error('[MySQL] updateTopupStatus error:', err.message);
      return false;
    }
  }

  async getTopupsByUserId(userId) {
    if (!this.connected) return [];
    try {
      const [rows] = await this.pool.query('SELECT * FROM topups WHERE user_id = ? ORDER BY created_at DESC', [userId]);
      return rows.map(r => this._mapTopup(r));
    } catch (err) {
      console.error('[MySQL] getTopupsByUserId error:', err.message);
      return [];
    }
  }

  // ================= PROMO CODES =================
  async upsertPromoCode(promo) {
    if (!this.connected) return null;
    try {
      await this.pool.query(`
        INSERT INTO promo_codes (id, code, reward_amount, description, max_uses, used_count, active, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          code = VALUES(code),
          reward_amount = VALUES(reward_amount),
          description = VALUES(description),
          max_uses = VALUES(max_uses),
          used_count = VALUES(used_count),
          active = VALUES(active)
      `, [
        promo.id,
        promo.code,
        promo.rewardAmount || 50,
        promo.description || '',
        promo.maxUses || 999999,
        promo.usedCount || 0,
        promo.active ? 1 : 0,
        promo.createdAt || new Date().toISOString(),
        promo.expiresAt || null
      ]);
      return promo;
    } catch (err) {
      console.error('[MySQL] upsertPromoCode error:', err.message);
      return null;
    }
  }

  async getAllPromoCodes() {
    if (!this.connected) return [];
    try {
      const [rows] = await this.pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
      return rows.map(r => this._mapPromo(r));
    } catch (err) {
      console.error('[MySQL] getAllPromoCodes error:', err.message);
      return [];
    }
  }

  async recordRedeem(redeem) {
    if (!this.connected) return null;
    try {
      await this.pool.query(`
        INSERT INTO redeem_history (id, promo_id, code, user_id, username, reward_amount, redeemed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        redeem.id,
        redeem.promoId,
        redeem.code,
        redeem.userId,
        redeem.username,
        redeem.rewardAmount,
        redeem.redeemedAt || new Date().toISOString()
      ]);
      await this.pool.query('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?', [redeem.promoId]);
      return redeem;
    } catch (err) {
      console.error('[MySQL] recordRedeem error:', err.message);
      return null;
    }
  }

  // ================= PRODUCTS SYNC =================
  async syncProducts(products) {
    if (!this.connected || !Array.isArray(products)) return;
    try {
      for (const p of products) {
        await this.pool.query(`
          INSERT INTO products (
            id, name, category, price, original_price, badge, version,
            short_desc, description, system_requirements, file_name, file_size,
            download_url, image_url, preview_url, rating, reviews_count, sold_count,
            stock, unlimited_stock, requires_machine_id, requires_key, plans_json, features_json, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            price = VALUES(price),
            original_price = VALUES(original_price),
            badge = VALUES(badge),
            version = VALUES(version),
            short_desc = VALUES(short_desc),
            description = VALUES(description),
            file_name = VALUES(file_name),
            file_size = VALUES(file_size),
            download_url = VALUES(download_url),
            rating = VALUES(rating),
            reviews_count = VALUES(reviews_count),
            sold_count = VALUES(sold_count),
            plans_json = VALUES(plans_json),
            features_json = VALUES(features_json)
        `, [
          p.id,
          p.name,
          p.category || 'general',
          p.price || 0,
          p.originalPrice || 0,
          p.badge || null,
          p.version || null,
          p.shortDesc || null,
          p.description || null,
          p.systemRequirements || null,
          p.fileName || null,
          p.fileSize || null,
          p.downloadUrl || null,
          p.imageUrl || null,
          p.previewUrl || null,
          p.rating || 5.0,
          p.reviewsCount || 0,
          p.soldCount || 0,
          p.stock || 'ไม่จำกัด',
          p.unlimitedStock ? 1 : 0,
          p.requiresMachineId ? 1 : 0,
          p.requiresKey ? 1 : 0,
          JSON.stringify(p.plans || []),
          JSON.stringify(p.features || []),
          p.createdAt || new Date().toISOString()
        ]);
      }
    } catch (err) {
      console.error('[MySQL] syncProducts error:', err.message);
    }
  }
}

export const mysqlDb = new MySQLDatabase();
