addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// El nombre de tu Namespace KV debe coincidir con el que configuraste en Cloudflare.
// Cloudflare inyectará automáticamente el objeto global SHORT_LINKS.
// Si usaste otro nombre, reemplaza SHORT_LINKS con el nombre de tu Namespace.
const KV_NAMESPACE = SHORT_LINKS; 

// Función para generar una cadena aleatoria (slug)
async function randomString(len = 6) {
    const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz23456789';
    let result = '';
    for (let i = 0; i < len; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname.slice(1); // Obtiene el slug (código corto)
  const longUrlParam = url.searchParams.get('url'); // Obtiene el parámetro 'url'

  // 1. Lógica de Redirección (para slugs)
  // Se activa si hay un path (slug) y NO hay un parámetro 'url' (para evitar conflictos)
  if (path.length > 0 && !longUrlParam) {
    const longUrl = await KV_NAMESPACE.get(path);

    if (longUrl) {
      // Redirección 302 (Temporal) a la URL larga almacenada
      return Response.redirect(longUrl, 302);
    }
    // Si no se encuentra el slug, devuelve 404
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
  
  try {
    new URL(longUrl)
  } catch (e) {
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
