import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
console.log('Host of Supabase URL:', url ? new URL(url).hostname : 'None');
