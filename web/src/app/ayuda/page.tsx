export default function AyudaPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Centro de Ayuda</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Primeros pasos</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-800">
          <li>Crea tu cuenta con tu nombre, comuna y teléfono.</li>
          <li>Explora partidos por comuna, fecha y nivel.</li>
          <li>Únete pagando tu cupo de forma segura.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Unirse a un partido</h2>
        <ol className="list-decimal pl-5 space-y-2 text-gray-800">
          <li>Ve a la sección Explorar y filtra por tu interés.</li>
          <li>Revisa los detalles del partido y la reputación del organizador.</li>
          <li>Presiona “Unirme” y completa el pago para confirmar tu cupo.</li>
        </ol>
        <p className="text-gray-600 mt-3 text-sm">Tu cupo queda reservado al instante y el organizador puede comunicarse contigo si es necesario.</p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Crear y organizar partidos</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-800">
          <li>Define lugar, fecha, hora, precio y cupos.</li>
          <li>Invita amigos o publica para recibir jugadores nuevos.</li>
          <li>Administra pagos, asistentes y reglas (por ejemplo, no-show).</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Pagos, reembolsos y no-show</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-800">
          <li>Los pagos se procesan en línea y se confirman al instante.</li>
          <li>Si el organizador cancela, puede iniciar reembolso a los jugadores.</li>
          <li>Las sanciones por no-show dependen de las reglas del organizador.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Seguridad y conducta</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-800">
          <li>Respeta a otros jugadores y las normas de la cancha.</li>
          <li>Reporta problemas o conductas inadecuadas a soporte.</li>
          <li>Revisa la calificación del organizador antes de unirte.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Más información</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-800">
          <li>
            Términos y Condiciones: <a href="/terminos" className="underline">/terminos</a>
          </li>
          <li>
            Política de Privacidad: <a href="/privacidad" className="underline">/privacidad</a>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Contacto</h2>
        <p className="text-gray-800">
          ¿Necesitas ayuda? Escríbenos a
          {" "}
          <a className="underline" href="mailto:contacto.pichapp@gmail.com">contacto.pichapp@gmail.com</a>.
        </p>
      </section>
    </main>
  );
}
