import Link from 'next/link';

export default function Custom404() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Página no encontrada</h2>
      <p style={{ marginBottom: '2rem' }}>La página que buscas no existe.</p>
      <Link href="/" style={{
        padding: '10px 20px',
        fontSize: '1rem',
        backgroundColor: '#0070f3',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '5px',
        display: 'inline-block'
      }}>
        Volver al inicio
      </Link>
    </div>
  );
}
