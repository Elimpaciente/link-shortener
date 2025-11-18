addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// === CONFIGURACIÓN ===
// 1. KV_NAMESPACE: Asegúrate de que este nombre coincida con el Binding que configures en Cloudflare.
const KV_NAMESPACE = SHORT_LINKS; 
// =====================

// Función para generar una cadena aleatoria (slug)
async function randomString(len = 6) {
    const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz23456789';
    let result = '';
    for (let i = 0; i < len; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Función para validar el formato de URL
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname.slice(1); // Obtiene el slug (código corto)
  const longUrlParam = url.searchParams.get('url'); // Obtiene el parámetro 'url'

  // 1. Lógica de Redirección (para slugs)
  // Si hay un path (slug) y NO hay un parámetro 'url' (para evitar conflictos)
  if (path.length > 0 && !longUrlParam) {
    const longUrl = await KV_NAMESPACE.get(path);

    if (longUrl) {
      // Redirección 302 (Temporal) a la URL larga almacenada
      return Response.redirect(longUrl, 302);
    }
    // Si no se encuentra el slug, devuelve 404 con el formato JSON del usuario
    return new Response(JSON.stringify({
      status_code: 404,
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes',
      message: 'Short URL not found'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // 2. Lógica de Acortamiento (para peticiones con ?url=)
  
  // Solo permitimos peticiones GET para acortar, como en tu código original
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({
      status_code: 400,
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes',
      message: 'Only GET requests are allowed'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  const longUrl = longUrlParam;
  
  // Validar la presencia del parámetro 'url'
  if (!longUrl || longUrl.trim() === '') {
    return new Response(JSON.stringify({
      status_code: 400,
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes',
      message: 'The url parameter is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Validar el formato de la URL
  if (!isValidUrl(longUrl)) {
    return new Response(JSON.stringify({
      status_code: 400,
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes',
      message: 'Invalid URL format'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  try {
    // Generar un slug único
    let slug;
    let existingUrl;
    do {
        slug = await randomString();
        existingUrl = await KV_NAMESPACE.get(slug);
    } while (existingUrl !== null);

    // Almacenar el slug y la URL larga original en KV
    // El valor de la clave es la URL larga.
    await KV_NAMESPACE.put(slug, longUrl);
    
    // Devolver la URL corta con el dominio del Worker
    const shortUrlWithDomain = `${url.origin}/${slug}`;
    
    return new Response(JSON.stringify({
      status_code: 200,
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes',
      response: shortUrlWithDomain // Devolvemos la URL con el dominio del Worker
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({
      status_code: 500, // Error interno del servidor
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes',
      message: `Error interno del servidor: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
