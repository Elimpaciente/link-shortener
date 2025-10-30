addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
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
  
  const longUrl = url.searchParams.get('url')
  
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
    const apiKey = '811a1660b4247dff3200e22a8e32d6646c734827'
    const apiUrl = 'https://api-ssl.bitly.com/v4/shorten'
    
    const payload = {
      long_url: longUrl
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      return new Response(JSON.stringify({
        status_code: 400,
        developer: 'El Impaciente',
        telegram_channel: 'https://t.me/Apisimpacientes',
        message: 'Error al acortar la URL con Bitly'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const data = await response.json()
    
    return new Response(JSON.stringify({
      status_code: 200,
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes',
      response: data.link
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({
      status_code: 400,
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes',
      message: 'Error al acortar la URL. Intente nuevamente.'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}