import { useRouter } from 'next/router';

export default function Custom500() {
  const router = useRouter();

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
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>500</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Error del servidor</h2>
      <p style={{ marginBottom: '2rem' }}>Algo salió mal en el servidor.</p>
      <button
        onClick={() => router.push('/')}
        style={{
          padding: '10px 20px',
          fontSize: '1rem',
          cursor: 'pointer',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        Volver al inicio
      </button>
    </div>
  );
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}
