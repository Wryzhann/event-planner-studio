import dotenv from 'dotenv';
dotenv.config();

console.log('Env variables:', Object.keys(process.env).filter(key => 
  key.includes('SUPABASE') || key.includes('DB') || key.includes('POSTGRES') || key.includes('URL') || key.includes('DATABASE') || key.includes('KEY')
));
