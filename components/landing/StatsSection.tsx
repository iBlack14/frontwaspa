export default function StatsSection() {
  const stats = [
    { value: '10K+', label: 'Usuarios Activos' },
    { value: '1M+', label: 'Mensajes Enviados' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Soporte' }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-emerald-600 dark:bg-emerald-700">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-emerald-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
