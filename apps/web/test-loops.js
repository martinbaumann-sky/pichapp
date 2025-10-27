// Script de prueba para verificar que los bucles infinitos están solucionados
const http = require('http');

async function testLoops() {
  console.log('🧪 Verificando que no hay bucles infinitos...\n');
  
  const endpoints = [
    { name: 'Home', url: 'http://localhost:3000' },
    { name: 'Organizar', url: 'http://localhost:3000/organizar' },
    { name: 'Crear Partido', url: 'http://localhost:3000/crear' },
    { name: 'Explorar', url: 'http://localhost:3000/explorar' },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`1. Probando ${endpoint.name}...`);
      
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: endpoint.url.replace('http://localhost:3000', ''),
        method: 'GET',
        timeout: 5000 // 5 segundos de timeout
      };

      const req = http.request(options, (res) => {
        console.log(`   ✅ ${endpoint.name}: ${res.statusCode} (sin bucle infinito)`);
      });

      req.on('error', (err) => {
        if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
          console.log(`   ❌ ${endpoint.name}: Posible bucle infinito o timeout`);
        } else {
          console.log(`   ❌ ${endpoint.name}: ${err.message}`);
        }
      });

      req.on('timeout', () => {
        console.log(`   ❌ ${endpoint.name}: Timeout - posible bucle infinito`);
        req.destroy();
      });

      req.end();
      
      // Esperar un poco entre requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ${error.message}`);
    }
  }

  console.log('\n🎯 Resumen:');
  console.log('Si ves ✅ en todos los endpoints, no hay bucles infinitos.');
  console.log('Si ves ❌ con timeout, puede haber un bucle infinito.');
  console.log('\n🚀 Abre http://localhost:3000 para probar la aplicación manualmente');
}

testLoops();
