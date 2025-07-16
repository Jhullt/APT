
// ------------ SELLO DE SEGURIDAD ------------

// OBTENER EL CÓDIGO DE SEGURIDAD CONTRA FALSIFICACIÓN DE PETICIÓN ENTRE SITIOS
function getCSRFToken () {
  let cookieValue = null;
  const name = 'csrftoken';
  if (document.cookie && document.cookie !== '') {
    document.cookie.split(';').forEach(cookie => {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
      }
    });
  }
  return cookieValue;
}

// ------------ FIN SELLO DE SEGURIDAD ------------



// ------------ OVERLAY DE ALERTAS ------------

const CAPAS = {
  // PROCESO VISUAL DE COMANDA ENVIADA A LA VISTA DE GARZON
  ok : { id : 'overlay-comanda',
         gif: '/static/gif/comanda_preparada.gif',
         txt: 'La comanda fue enviada al garzón' },
  // ERROR AL ENTREGAR LA COMANDA
  err: { id : 'overlay-comanda-1',
         gif: '/static/gif/error.gif',
         txt: 'Ha ocurrido un problema al entregar la comanda ☹️' },
  // ERROR DE CONEXIÓN
  net: { id : 'overlay-comanda-2',
         gif: '/static/gif/internet.gif',
         txt: 'Verifica tu conexión a internet ☹️' }
};

// OCULTA TODOS LOS OVERLAYS
function overlayOcultarTodo () {
  Object.values(CAPAS).forEach(({id}) =>
    document.getElementById(id)?.classList.add('oculto')
  );
}

// MUESTRA EL OVERLAY SEGÚN LA ALERTA
function overlayMostrar (escena, mensajeExtra = null) {
  const cfg = CAPAS[escena];
  if (!cfg) return;

  overlayOcultarTodo();

  const capa = document.getElementById(cfg.id);
  if (!capa) return;

  // CAMBIAR GIF
  const img = capa.querySelector('img');
  if (img) img.src = cfg.gif;

  // CAMBIAR TEXTO
  const h2 = capa.querySelector('h2');
  if (h2) h2.textContent = mensajeExtra ?? cfg.txt;

  capa.classList.remove('oculto');

  // CERRAR
  capa.querySelector('#btn-ok, [id^="cerrar-overlay"]')
      ?.addEventListener('click', overlayOcultarTodo, { once:true });
}

// ------------ FIN OVERLAY DE ALERTAS ------------



// ------------ PRECIOS VISTA COCINA  ------------

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.productos-comanda p').forEach(el => {
    el.textContent = el.textContent.replace(/\s-\s\$\d[\d\.\,]*/g, '');
  });
});

// ------------ FIN PRECIOS VISTA COCINA  ------------



// ------------ ENTREGAR COMANDA ------------

document.querySelectorAll('.btn-entregar-comanda').forEach(btn => {
  btn.addEventListener('click', async () => {

    const id = btn.dataset.id;
    if (!id) return;

    overlayMostrar('ok');

    try {
      const res = await fetch(`/comanda/entregar-cocina/${id}/`, {
        method  : 'POST',
        headers : { 'X-CSRFToken': getCSRFToken() }
      });

      if (res.ok) {
        setTimeout(() => location.reload(), 1500);
      } else {
        overlayMostrar('err');
      }

    } catch (_) {
      overlayMostrar('net');
    }
  });
});

// ------------ FIN ENTREGAR COMANDA ------------