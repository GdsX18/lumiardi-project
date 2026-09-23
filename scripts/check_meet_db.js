const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
});

async function main() {
  console.log('Connecting to Postgres...');
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log('Existing tables:', res.rows.map(r => r.table_name));

  // Check meet_rooms, meet_participants, meet_signals
  const meetTables = res.rows.map(r => r.table_name).filter(t => t.startsWith('meet_'));
  console.log('Meet tables found:', meetTables);

  if (meetTables.length < 3) {
    console.log('Creating meet tables in Postgres...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS meet_rooms (
        id VARCHAR(100) PRIMARY KEY,
        passcode VARCHAR(50),
        host_id VARCHAR(100) NOT NULL,
        host_name VARCHAR(255) NOT NULL,
        provider VARCHAR(50) DEFAULT 'webrtc_native',
        daily_room_url TEXT,
        daily_token TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS meet_participants (
        room_id VARCHAR(100) NOT NULL,
        participant_id VARCHAR(100) NOT NULL,
        participant_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'caller',
        user_role VARCHAR(50) NOT NULL DEFAULT 'model',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (room_id, participant_id)
      );
      CREATE INDEX IF NOT EXISTS idx_meet_part_room ON meet_participants(room_id);
      CREATE INDEX IF NOT EXISTS idx_meet_part_last_seen ON meet_participants(last_seen_at DESC);

      CREATE TABLE IF NOT EXISTS meet_signals (
        id VARCHAR(100) PRIMARY KEY,
        room_id VARCHAR(100) NOT NULL,
        sender_id VARCHAR(100) NOT NULL,
        target_id VARCHAR(100),
        type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        consumed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_meet_signals_room_target ON meet_signals(room_id, target_id, consumed);
      CREATE INDEX IF NOT EXISTS idx_meet_signals_created ON meet_signals(created_at ASC);
    `);
    console.log('Meet tables created successfully in PostgreSQL!');
  }

  // Check what is currently inside meet_rooms, meet_participants, meet_signals
  const roomsRes = await pool.query('SELECT * FROM meet_rooms');
  console.log('Current rooms in DB:', roomsRes.rows);

  const partsRes = await pool.query('SELECT * FROM meet_participants');
  console.log('Current participants in DB:', partsRes.rows);

  const sigsRes = await pool.query('SELECT id, room_id, sender_id, type, consumed, created_at FROM meet_signals');
  console.log('Current signals in DB:', sigsRes.rows);

  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
