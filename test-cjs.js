import { execSync } from 'child_process';
try { 
  execSync('node dist/server.cjs & sleep 2 && kill $!', { stdio: 'inherit' }); 
} catch(e) {}
