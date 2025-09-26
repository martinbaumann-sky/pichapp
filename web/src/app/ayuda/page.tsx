export default function AyudaPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Centro de Ayuda</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Primeros pasos</h2>
        <ul className="list-disc pl-5 space-y-2 text-[color:var(--fg)]">
          <li>Crea tu cuenta con tu nombre, comuna y teléfono.</li>
          <li>Explora partidos por comuna, fecha y nivel.</li>
          <li>Únete y toma tu cupo gratis.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Unirse a un partido</h2>
        <ol className="list-decimal pl-5 space-y-2 text-[color:var(--fg)]">
          <li>Ve a la sección Explorar y filtra por lo que te interese.</li>
          <li>Revisa los detalles del partido y la reputación del organizador.</li>
          <li>Presiona "Unirme" y confirma tu cupo gratis.</li>
        </ol>
        <p className="text-[color:var(--fg-muted)] mt-3 text-sm">Tu cupo queda confirmado al instante y el organizador puede comunicarse contigo si es necesario.</p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Crear y organizar partidos</h2>
        <ul className="list-disc pl-5 space-y-2 text-[color:var(--fg)]">
          <li>Define lugar, fecha, hora y cupos disponibles.</li>
          <li>Invita amigos o publica para recibir jugadores nuevos.</li>
          <li>Administra asistentes, reglas y comunicación (por ejemplo, no-show).</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Reservas y no-show</h2>
        <ul className="list-disc pl-5 space-y-2 text-[color:var(--fg)]">
          <li>Las reservas se confirman automáticamente sin cobros.</li>
          <li>Si necesitas cancelar, avisa a los jugadores con anticipación.</li>
          <li>Define reglas claras para no-show y compártelas en la descripción.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Seguridad y conducta</h2>
        <ul className="list-disc pl-5 space-y-2 text-[color:var(--fg)]">
          <li>Respeta a otros jugadores y las normas de la cancha.</li>
          <li>Reporta problemas o conductas inadecuadas a soporte.</li>
          <li>Revisa la calificación del organizador antes de unirte.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Más información</h2>
        <ul className="list-disc pl-5 space-y-2 text-[color:var(--fg)]">
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
        <p className="text-[color:var(--fg)]">
          ¿Necesitas ayuda? Escríbenos a
          {" "}
          <a className="underline" href="mailto:contacto.pichapp@gmail.com">contacto.pichapp@gmail.com</a>.
        </p>
      </section>
    </main>
  );
}
