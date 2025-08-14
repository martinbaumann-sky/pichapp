// Script de prueba para verificar que los errores están solucionados
const http = require('http');

async function testEndpoints() {
  console.log('🧪 Probando endpoints después de las correcciones...\n');
  
  const endpoints = [
    { name: 'Home', url: 'http://localhost:3000' },
    { name: 'Organizar (debe redirigir si no hay sesión)', url: 'http://localhost:3000/organizar' },
    { name: 'API Session', url: 'http://localhost:3000/api/auth/local/session' },
    { name: 'API Signup', url: 'http://localhost:3000/api/auth/local/signup', method: 'POST' },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`1. Probando ${endpoint.name}...`);
      
      if (endpoint.method === 'POST') {
        // Solo probar que el endpoint responde
        const options = {
          hostname: 'localhost',
          port: 3000,
          path: endpoint.url.replace('http://localhost:3000', ''),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        };

        const req = http.request(options, (res) => {
          console.log(`   ✅ ${endpoint.name}: ${res.statusCode}`);
        });

        req.on('error', (err) => {
          console.log(`   ❌ ${endpoint.name}: ${err.message}`);
        });

        req.write(JSON.stringify({ test: true }));
        req.end();
      } else {
        const response = await fetch(endpoint.url);
        console.log(`   ✅ ${endpoint.name}: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ${error.message}`);
    }
  }

  console.log('\n🎯 Resumen:');
  console.log('Si ves ✅ en todos los endpoints, los errores están solucionados.');
  console.log('Si ves ❌, puede que el servidor no esté corriendo o haya otros problemas.');
  console.log('\n🚀 Abre http://localhost:3000 para probar la aplicación');
}

testEndpoints();
