#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const certsDir = path.join(process.cwd(), 'certs');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Generate self-signed certificate for localhost
try {
  console.log('Generating self-signed certificate for localhost...');
  
  execSync(`openssl req -x509 -newkey rsa:4096 -keyout ${certsDir}/key.pem -out ${certsDir}/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"`, {
    stdio: 'inherit'
  });
  
  console.log('✅ SSL certificates generated successfully!');
  console.log(`📁 Certificates saved to: ${certsDir}`);
  console.log('🔒 Your server can now run with HTTPS on localhost');
} catch (error) {
  console.error('❌ Error generating certificates:', error.message);
  console.log('\n📝 Manual certificate generation:');
  console.log(`cd ${certsDir}`);
  console.log('openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"');
}