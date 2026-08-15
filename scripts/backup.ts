import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

async function performBackup() {
  const dbDir = path.resolve(process.cwd(), 'data');
  const dbFile = path.join(dbDir, 'founder-os.db');
  const backupDir = process.env.BACKUP_DIR
    ? path.resolve(process.env.BACKUP_DIR)
    : path.resolve(process.cwd(), 'backups');

  if (!fs.existsSync(dbFile)) {
    console.warn(`[backup] Database file not found at ${dbFile}`);
    process.exit(1);
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Flush WAL log before copying
  try {
    const rawDb = new Database(dbFile);
    rawDb.pragma('wal_checkpoint(TRUNCATE)');
    rawDb.close();
  } catch (err) {
    console.warn('[backup] WAL checkpoint warning:', err);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `asteria-os-backup-${timestamp}.db`;
  const destination = path.join(backupDir, backupFileName);

  fs.copyFileSync(dbFile, destination);
  console.log(`[backup] Database snapshot saved successfully: ${destination}`);
}

performBackup().catch((err) => {
  console.error('[backup] Backup failed:', err);
  process.exit(1);
});
