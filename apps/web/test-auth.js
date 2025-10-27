// Script de prueba para verificar autenticación
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://demo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5OTQ5NzYwMCwiZXhwIjoyMDE1MDczNjAwfQ.demo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🧪 Probando autenticación...');
  
  try {
    // Test 1: Verificar conexión
    console.log('1. Verificando conexión a Supabase...');
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Conexión exitosa');
    
    // Test 2: Crear usuario de prueba
    console.log('2. Creando usuario de prueba...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'test123456';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Usuario de Prueba',
          comuna: 'Santiago',
          position: 'DELANTERO'
        }
      }
    });
    
    if (signUpError) {
      console.log('❌ Error en signup:', signUpError.message);
    } else {
      console.log('✅ Usuario creado:', signUpData.user?.email);
    }
    
    // Test 3: Sign in
    console.log('3. Probando sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.log('❌ Error en signin:', signInError.message);
    } else {
      console.log('✅ Sign in exitoso:', signInData.user?.email);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testAuth();
