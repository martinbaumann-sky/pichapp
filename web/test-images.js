// Script de prueba para verificar que las imágenes se generan correctamente
const http = require('http');

async function testImages() {
  console.log('🖼️ Verificando generación de imágenes...\n');
  
  const endpoints = [
    { name: 'API Matches', url: 'http://localhost:3000/api/matches' },
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
        timeout: 10000
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.items && json.items.length > 0) {
              const hasImages = json.items.some(item => item.coverImageUrl);
              console.log(`   ✅ ${endpoint.name}: ${res.statusCode} - ${json.items.length} partidos encontrados`);
              console.log(`   🖼️ Imágenes: ${hasImages ? '✅ Generadas' : '❌ No generadas'}`);
              if (hasImages) {
                json.items.forEach((item, i) => {
                  console.log(`      ${i + 1}. ${item.title}: ${item.coverImageUrl ? '✅' : '❌'}`);
                });
              }
            } else {
              console.log(`   ⚠️ ${endpoint.name}: ${res.statusCode} - Sin partidos`);
            }
          } catch (e) {
            console.log(`   ✅ ${endpoint.name}: ${res.statusCode} (respuesta no JSON)`);
          }
        });
      });

      req.on('error', (err) => {
        console.log(`   ❌ ${endpoint.name}: ${err.message}`);
      });

      req.on('timeout', () => {
        console.log(`   ❌ ${endpoint.name}: Timeout`);
        req.destroy();
      });

      req.end();
      
      // Esperar entre requests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ${error.message}`);
    }
  }

  console.log('\n🎯 Resumen:');
  console.log('Si ves ✅ en imágenes, las fotos se están generando correctamente.');
  console.log('Si ves ❌, puede que falte la API key de Google Maps.');
  console.log('\n🚀 Abre http://localhost:3000/explorar para ver las imágenes');
}

testImages();
