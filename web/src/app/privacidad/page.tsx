export default function PrivacidadPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Política de Privacidad</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Qué datos recopilamos</h2>
        <ul className="list-disc pl-5 text-[color:var(--fg)] space-y-1">
          <li>Datos de cuenta: nombre, comuna, teléfono y correo.</li>
          <li>Datos de uso: páginas visitadas, acciones básicas en la app.</li>
          <li>Datos de transacción: información necesaria para pagos y confirmaciones.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Para qué usamos tus datos</h2>
        <ul className="list-disc pl-5 text-[color:var(--fg)] space-y-1">
          <li>Coordinar partidos, gestionar pagos y mejorar tu experiencia.</li>
          <li>Prevenir fraudes y mantener la seguridad de la plataforma.</li>
          <li>Comunicar cambios importantes de servicio.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. Compartir datos</h2>
        <p className="text-[color:var(--fg)]">
          No publicamos tu teléfono. Podemos compartir datos mínimos con proveedores de pago y
          servicios necesarios para operar la app, bajo acuerdos de confidencialidad.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Conservación y seguridad</h2>
        <ul className="list-disc pl-5 text-[color:var(--fg)] space-y-1">
          <li>Conservamos datos solo el tiempo necesario para los fines descritos.</li>
          <li>Aplicamos medidas razonables de seguridad técnica y organizativa.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Tus derechos</h2>
        <ul className="list-disc pl-5 text-[color:var(--fg)] space-y-1">
          <li>Acceso, rectificación, actualización y eliminación de datos, según la ley aplicable.</li>
          <li>Puedes solicitar información o ejercer derechos en cualquier momento.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">6. Contacto</h2>
        <p className="text-[color:var(--fg)]">
          Consultas de privacidad: <a className="underline" href="mailto:contacto.pichapp@gmail.com">contacto.pichapp@gmail.com</a>.
        </p>
      </section>
    </main>
  );
}
