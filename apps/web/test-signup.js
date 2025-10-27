// Script de prueba para verificar registro
const fetch = require('node-fetch');

async function testSignup() {
  console.log('🧪 Probando registro de usuario...');
  
  try {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'test123456';
    
    const signupData = {
      email: testEmail,
      password: testPassword,
      name: 'Usuario de Prueba',
      comuna: 'Santiago',
      position: 'DELANTERO'
    };
    
    console.log('1. Enviando datos de registro:', signupData);
    
    const response = await fetch('http://localhost:3000/api/auth/local/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(signupData)
    });
    
    const data = await response.json();
    console.log('2. Respuesta del servidor:', data);
    
    if (response.ok) {
      console.log('✅ Registro exitoso');
      
      // Probar login
      console.log('3. Probando login...');
      const loginResponse = await fetch('http://localhost:3000/api/auth/local/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });
      
      const loginData = await loginResponse.json();
      console.log('4. Respuesta del login:', loginData);
      
      if (loginResponse.ok) {
        console.log('✅ Login exitoso');
      } else {
        console.log('❌ Error en login:', loginData.error);
      }
      
    } else {
      console.log('❌ Error en registro:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testSignup();
