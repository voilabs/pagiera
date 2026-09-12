import pg from 'pg';
const c = new pg.Client({ connectionString: 'postgresql://localhost:12345@localhost:5432/pagiera' });
await c.connect();
const r = await c.query(process.argv[2]);
console.log(JSON.stringify(r.rows, null, 1).slice(0, 4000));
await c.end();
