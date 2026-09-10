import pool from './db';
import { hashPassword } from './auth';

export async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();

    try {
      // Create users table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'guru', 'siswa') DEFAULT 'siswa',
          class_name VARCHAR(100),
          nis VARCHAR(50),
          photo VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Create students table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS students (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          nis VARCHAR(50),
          class VARCHAR(100),
          jurusan VARCHAR(100),
          email VARCHAR(255),
          photo VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Create attendance table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NULL,
          user_id INT NOT NULL,
          date DATE NOT NULL,
          status ENUM('hadir', 'tidak_hadir', 'terlambat', 'izin', 'sakit', 'alpha') NOT NULL,
          check_in_time TIME NULL,
          check_out_time TIME NULL,
          location_latitude DECIMAL(10, 8) NULL,
          location_longitude DECIMAL(11, 8) NULL,
          location_address VARCHAR(255),
          photo VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_attendance (user_id, date, student_id),
          KEY idx_attendance_date (date),
          KEY idx_attendance_user_date (user_id, date)
        )
      `);

      // Create leave_requests table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS leave_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NULL,
          student_name VARCHAR(255) NOT NULL,
          user_id INT NULL,
          type ENUM('izin', 'sakit') NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          reason TEXT NOT NULL,
          evidence VARCHAR(255),
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reviewed_by INT,
          reviewed_at TIMESTAMP NULL,
          review_notes TEXT,
          KEY idx_leave_user (user_id),
          KEY idx_leave_status (status)
        )
      `);

      // Create notifications table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
          \`read\` BOOLEAN DEFAULT FALSE,
          action_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          KEY idx_notif_user (user_id)
        )
      `);

      // Create settings table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          \`key\` VARCHAR(100) UNIQUE NOT NULL,
          value TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Seed default admin/guru/siswa users if not exists
      const defaultUsers = [
        { name: 'Administrator', email: 'admin@sekolah.sch.id', password: 'admin123', role: 'admin', className: 'Staff' },
        { name: 'Guru Wali Kelas', email: 'guru@sekolah.sch.id', password: 'guru123', role: 'guru', className: 'XI RPL 1' },
        { name: 'Arfan Aysel', email: 'siswa@sekolah.sch.id', password: 'siswa123', role: 'siswa', className: 'XI RPL 1' },
      ];

      for (const u of defaultUsers) {
        const [existing] = await connection.query(
          'SELECT id FROM users WHERE email = ? LIMIT 1',
          [u.email]
        );
        const list = existing as any[];
        if (list.length === 0) {
          const hashed = await hashPassword(u.password);
          await connection.query(
            'INSERT INTO users (name, email, password, role, class_name) VALUES (?, ?, ?, ?, ?)',
            [u.name, u.email, hashed, u.role, u.className]
          );
          console.log(`Default user created: ${u.email} / ${u.password} (${u.role})`);
        }
      }

      // Insert default students if table is empty
      const [studentCount] = await connection.query('SELECT COUNT(*) as count FROM students');
      const countRow = studentCount as any[];

      if (countRow[0].count === 0) {
        const defaultStudents = [
          "Aditya Pratama", "Aisyah Putri Ramadhani", "Alif Maulana Yusuf",
          "Andini Cahya Ningrum", "Arfan Aysel", "Bagas Satrio Wibowo",
          "Bunga Citra Lestari", "Candra Wijaya Kusuma", "Citra Ayu Larasati",
          "Dafa Alfiansyah", "Dewi Anggraini", "Dimas Aditya Nugraha",
          "Dinda Kirana Salsabila", "Eko Prasetyo", "Fajar Ramadhan",
          "Fira Nadia Rahma", "Galih Permana", "Gita Rahmadani",
          "Hafiz Alghifari", "Intan Nabila", "Iqbal Fauzi",
          "Jihan Aulia Azzahra", "Kevin Wijaya", "Laras Maharani",
          "Muhammad Rizki", "Nabila Zahra", "Naufal Hidayat",
          "Putri Amelia", "Raka Febriansyah", "Salsabila Nur Fadilah"
        ];

        const classes = [
          "X RPL", "X AK", "X BR", "X MP",
          "XI RPL", "XI AK", "XI BR", "XI MP",
          "XII RPL", "XII AK", "XII BR", "XII MP"
        ];

        for (let i = 0; i < defaultStudents.length; i++) {
          const cls = classes[i % classes.length];
          await connection.query(
            'INSERT INTO students (name, class) VALUES (?, ?)',
            [defaultStudents[i], cls]
          );
        }

        console.log('Default students inserted');
      }

      // Ensure late threshold setting exists
      const [settings] = await connection.query(
        'SELECT id FROM settings WHERE `key` = ? LIMIT 1',
        ['late_threshold']
      );
      const settingsList = settings as any[];
      if (settingsList.length === 0) {
        await connection.query(
          'INSERT INTO settings (`key`, value) VALUES (?, ?)',
          ['late_threshold', process.env.LATE_THRESHOLD || '07:30']
        );
      }

      console.log('Database initialized successfully');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}