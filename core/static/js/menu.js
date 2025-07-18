// ------------ MENU HAMBURGUESA ------------

document.addEventListener('DOMContentLoaded', () => {
  
  // BOTÓN QUE ABRE EL MENÚ LATERAL
  const btnSidebar = document.getElementById('btn-sidebar-toggle');

  // MENÚ LATERAL (SIDEBAR)
  const sidebar = document.getElementById('sidebar');

  // CUANDO SE HACE CLIC EN EL BOTÓN MUESTRA EL MENÚ
  btnSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('mostrar');
  });

  // SI SE HACE CLIC FUERA DEL MENÚ Y ESTÁ ABIERTO ESTE SE CIERRA
  document.addEventListener('click', (e) => {
    const clickedInside = sidebar.contains(e.target) || btnSidebar.contains(e.target);
    if (!clickedInside && sidebar.classList.contains('mostrar')) {
      sidebar.classList.remove('mostrar');
    }
  });
});

// ------------ FIN MENU HAMBURGUESA ------------



// ------------ CERRAR SESIÓN ------------

// BOTÓN PARA CERRAR SESIÓN
const btnCerrarSesion = document.getElementById('cerrar-sesion');

// FUNCIÓN BOTÓN
if (btnCerrarSesion) {

  // CUANDO SE HACE CLIC
  btnCerrarSesion.addEventListener('click', () => {
    fetch('/logout/')
      .then(() => {
        // LUEGO REDIRIGE AL USUARIO A ESA MISMA RUTA
        window.location.href = '/logout/';
      });
  });
}

// ------------ FIN CERRAR SESIÓN ------------