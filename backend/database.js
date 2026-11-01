require('dotenv').config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const certificadoSSL = fs.readFileSync(
    path.join(__dirname, 'certificates', 'prod-ca-2021.crt'),
    'utf8'
);

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    ssl: process.env.DB_SSL === 'true'
        ? {
            ca: certificadoSSL,
            rejectUnauthorized: true
        }
        : false,

    connectionTimeoutMillis: 10000
});

module.exports = pool;