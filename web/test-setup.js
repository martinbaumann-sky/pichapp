// Script de prueba para verificar configuración
const fs = require('fs');
const path = require('path');

console.log('🧪 Verificando configuración de Pichanga...\n');

// 1. Verificar archivos críticos
const criticalFiles = [
  '.env',
  'prisma/dev.db',
  'prisma/migrations',
  'src/components/AuthDialog.tsx',
  'src/app/partido/[id]/page.tsx'
];

console.log('1. Verificando archivos críticos:');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// 2. Verificar .env
console.log('\n2. Verificando variables de entorno:');
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_BASE_URL'
  ];
  
  envVars.forEach(varName => {
    const hasVar = envContent.includes(varName);
    console.log(`   ${hasVar ? '✅' : '❌'} ${varName}`);
  });
} catch (error) {
  console.log('   ❌ No se pudo leer .env');
}

// 3. Verificar base de datos
console.log('\n3. Verificando base de datos:');
try {
  const dbExists = fs.existsSync('prisma/dev.db');
  console.log(`   ${dbExists ? '✅' : '❌'} Base de datos SQLite creada`);
  
  if (dbExists) {
    const stats = fs.statSync('prisma/dev.db');
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`   📊 Tamaño: ${sizeKB} KB`);
  }
} catch (error) {
  console.log('   ❌ Error verificando base de datos');
}

// 4. Verificar migraciones
console.log('\n4. Verificando migraciones:');
try {
  const migrationsDir = 'prisma/migrations';
  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir);
    console.log(`   ✅ ${migrations.length} migración(es) encontrada(s)`);
    migrations.forEach(migration => {
      console.log(`      📁 ${migration}`);
    });
  } else {
    console.log('   ❌ No se encontró directorio de migraciones');
  }
} catch (error) {
  console.log('   ❌ Error verificando migraciones');
}

// 5. Verificar package.json scripts
console.log('\n5. Verificando scripts disponibles:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const scripts = packageJson.scripts || {};
  const requiredScripts = ['dev', 'build', 'prisma:generate', 'prisma:migrate', 'seed'];
  
  requiredScripts.forEach(script => {
    const hasScript = scripts[script];
    console.log(`   ${hasScript ? '✅' : '❌'} npm run ${script}`);
  });
} catch (error) {
  console.log('   ❌ Error verificando package.json');
}

console.log('\n🎯 Resumen:');
console.log('Si ves ✅ en todos los puntos, la configuración está correcta.');
console.log('Si ves ❌, necesitas ejecutar:');
console.log('   npm run prisma:generate');
console.log('   npm run prisma:migrate');
console.log('   npm run seed');
console.log('   npm run dev');
console.log('\n🚀 Luego abre: http://localhost:3000');
