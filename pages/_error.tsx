import { NextPageContext } from 'next';

interface ErrorProps {
  statusCode?: number;
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>
        {statusCode || 'Error'}
      </h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
        {statusCode
          ? `Ocurrió un error ${statusCode} en el servidor`
          : 'Ocurrió un error en el cliente'}
      </p>
      <a 
        href="/"
        style={{
          padding: '10px 20px',
          fontSize: '1rem',
          backgroundColor: '#0070f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px',
          display: 'inline-block'
        }}
      >
        Volver al inicio
      </a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
