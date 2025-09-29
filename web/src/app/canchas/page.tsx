import Link from "next/link";

export default function CanchasPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Canchas asociadas</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Gestiona tu cancha con PichangApp</h1>
          <p className="mt-4 max-w-2xl text-base text-gray-600">
            Centraliza tus reservas, confirma asistentes y recibe pagos online desde un panel pensado para administradores de recintos.
            Déjanos tus datos y nuestro equipo validará la información para activar tu cuenta oficial.
          </p>
          <div className="mt-6 inline-flex flex-wrap items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
            <span className="font-semibold text-gray-900">contacto.pichapp@gmail.com</span>
            <span className="text-gray-400">•</span>
            <a
              href="mailto:contacto.pichapp@gmail.com?subject=Quiero%20registrar%20mi%20cancha"
              className="font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Enviar correo
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 space-y-12">
        <section className="grid gap-6 sm:grid-cols-2">
          {[{
            title: "1. Completa tus datos",
            description: "Envíanos el nombre comercial de la cancha, dirección, comuna, datos de contacto y coordenadas aproximadas.",
          }, {
            title: "2. Validación manual",
            description: "Nuestro equipo revisa la información y te responde desde contacto.pichapp@gmail.com en menos de 24 horas hábiles.",
          }, {
            title: "3. Activación",
            description: "Al aprobar tu solicitud recibirás un acceso de administrador y tu perfil aparecerá como verificado dentro de la plataforma.",
          }, {
            title: "4. Panel dedicado",
            description: "Desde el Panel Cancha podrás crear partidos, revisar reservas y bloquear fechas sin depender de formularios públicos.",
          }].map((step) => (
            <div key={step.title} className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">{step.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-3xl border border-dashed border-gray-300 bg-white/70 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">¿Qué necesitas enviar?</h2>
            <ul className="mt-3 space-y-3 text-sm text-gray-600">
              <li><span className="font-semibold text-gray-800">• Datos básicos:</span> nombre del recinto, dirección completa, comuna y RUT (opcional).</li>
              <li><span className="font-semibold text-gray-800">• Contacto principal:</span> nombre, correo y teléfono de la persona administradora.</li>
              <li><span className="font-semibold text-gray-800">• Infraestructura:</span> número de canchas, superficies y horarios disponibles.</li>
              <li><span className="font-semibold text-gray-800">• Ubicación:</span> referencia en Google Maps o coordenadas para precargar la ubicación al crear partidos.</li>
            </ul>
          </div>
          <div className="lg:col-span-2 rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-6 text-white shadow-lg">
            <h3 className="text-lg font-semibold">Estado de solicitud</h3>
            <p className="mt-3 text-sm text-gray-100">
              Seguimos el proceso manualmente para garantizar la calidad de las canchas en PichangApp. Revisa tu bandeja de entrada y spam por la respuesta.
            </p>
            <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm">
              <p className="font-semibold">¿Ya enviaste tus datos?</p>
              <p className="mt-1 text-gray-200">Puedes responder al correo de verificación para actualizar información o adjuntar fotografías del recinto.</p>
            </div>
            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-white"
            >
              Volver al inicio
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
