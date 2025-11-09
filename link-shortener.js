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
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
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
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
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
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
  
  const shortenAPIs = [
    'https://is.gd/create.php?format=simple&url=',
    'https://clck.ru/--?url=',
    'https://v.gd/create.php?format=simple&url='
  ]
  
  let shortUrl = null
  let lastError = null
  
  for (const api of shortenAPIs) {
    try {
      const response = await fetch(api + encodeURIComponent(longUrl), {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      })
      
      if (response.ok) {
        const result = await response.text()
        if (result && result.trim() !== '') {
          shortUrl = result.trim()
          break
        }
      }
      
      lastError = `API returned status ${response.status}`
    } catch (error) {
      lastError = error.message
      continue
    }
  }
  
  if (shortUrl) {
    return new Response(JSON.stringify({
      status_code: 200,
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes',
      response: shortUrl
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } else {
    return new Response(JSON.stringify({
      status_code: 400,
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes',
      message: 'All shortening services failed'
    }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
