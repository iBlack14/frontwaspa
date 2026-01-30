import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      backendUrl,
      nodeEnv: process.env.NODE_ENV,
    },
    tests: {} as Record<string, any>,
  };

  // Test 1: Verificar si la variable está configurada
  if (!backendUrl) {
    diagnostics.tests.configCheck = {
      status: 'FAIL',
      message: 'NEXT_PUBLIC_BACKEND_URL no está configurada',
    };
    return res.status(500).json(diagnostics);
  }

  diagnostics.tests.configCheck = {
    status: 'OK',
    message: `Backend URL configurada: ${backendUrl}`,
  };

  // Test 2: Prueba de conectividad básica
  try {
    const startTime = Date.now();
    const response = await axios.get(`${backendUrl}/health`, {
      timeout: 5000,
    });
    const elapsed = Date.now() - startTime;

    diagnostics.tests.connectivity = {
      status: 'OK',
      message: `Conectado al backend en ${elapsed}ms`,
      responseTime: elapsed,
      backendStatus: response.data,
    };
  } catch (error: any) {
    diagnostics.tests.connectivity = {
      status: 'FAIL',
      message: `No se pudo conectar al backend: ${error.message}`,
      error: error.message,
      code: error.code,
    };
  }

  // Test 3: Prueba de acceso a API de instancias
  try {
    const response = await axios.get(`${backendUrl}/api/instances`, {
      timeout: 5000,
      headers: {
        'Authorization': 'Bearer test-token',
      },
      validateStatus: () => true,
    });

    diagnostics.tests.apiInstances = {
      status: response.status < 500 ? 'OK' : 'FAIL',
      statusCode: response.status,
      message: `API de instancias respondió con status ${response.status}`,
      hasData: !!response.data,
    };
  } catch (error: any) {
    diagnostics.tests.apiInstances = {
      status: 'FAIL',
      message: `Error al acceder a API de instancias: ${error.message}`,
      error: error.message,
    };
  }

  // Resumen general
  const allOk = Object.values(diagnostics.tests).every((test: any) => test.status === 'OK');
  
  return res.status(allOk ? 200 : 500).json({
    ...diagnostics,
    summary: {
      status: allOk ? 'HEALTHY' : 'UNHEALTHY',
      message: allOk 
        ? 'Backend conectado correctamente' 
        : 'Hay problemas de conectividad con el backend',
    },
  });
}
