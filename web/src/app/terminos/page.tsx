export default function TerminosPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Términos y Condiciones</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Aceptación</h2>
        <p className="text-gray-700">
          Al usar PichangApp aceptas estos términos y cualquier actualización futura. Si no estás de
          acuerdo, por favor no utilices la plataforma.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Alcance del servicio</h2>
        <p className="text-gray-700">
          PichangApp es una plataforma para organizar y unirse a partidos de fútbol amateur. La
          responsabilidad por cada evento recae en su organizador; PichangApp facilita la coordinación
          y los pagos, pero no produce ni supervisa los eventos.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. Registro y cuenta</h2>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Debes proporcionar información veraz y mantenerla actualizada.</li>
          <li>Eres responsable de la confidencialidad de tu cuenta.</li>
          <li>Podemos suspender cuentas por uso indebido o fraude.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Pagos y comisiones</h2>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Los pagos de cupos se procesan en línea y se confirman al instante.</li>
          <li>Las comisiones aplicables se informan antes de confirmar el pago.</li>
          <li>Los organizadores reciben los fondos netos según lo informado en la app.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Cancelaciones y reembolsos</h2>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Si el organizador cancela, puede iniciar el reembolso a los jugadores.</li>
          <li>Los plazos y condiciones de reembolso se comunican en la app.</li>
          <li>Los costos de procesamiento pueden no ser reembolsables según el proveedor de pagos.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. No-show y conducta</h2>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>El no-show puede ser sancionado por el organizador según sus reglas.</li>
          <li>Se espera respeto y conducta deportiva en todos los eventos.</li>
          <li>Reporta conductas inadecuadas a soporte para revisión.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. Responsabilidad</h2>
        <p className="text-gray-700">
          En la medida permitida por la ley, PichangApp no es responsable por lesiones, daños o
          pérdidas ocurridas en eventos organizados por terceros. Recomendamos contar con cobertura
          personal adecuada y seguir normas de seguridad.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Propiedad intelectual</h2>
        <p className="text-gray-700">Marcas, logos y contenidos de la app pertenecen a sus titulares.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">9. Cambios en los términos</h2>
        <p className="text-gray-700">
          Podemos actualizar estos términos. Los cambios relevantes se comunicarán por la app o por
          correo. El uso continuo implica aceptación.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">10. Contacto</h2>
        <p className="text-gray-700">
          Dudas o reclamos: <a className="underline" href="mailto:contacto.pichapp@gmail.com">contacto.pichapp@gmail.com</a>.
        </p>
      </section>
    </main>
  );
}
