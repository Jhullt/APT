// MENU HAMBURGUESA

document.addEventListener('DOMContentLoaded', () => {
    const btnSidebar = document.getElementById('btn-sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
  
    btnSidebar.addEventListener('click', () => {
      sidebar.classList.toggle('mostrar');
    });
  
    document.addEventListener('click', (e) => {
      const clickedInside = sidebar.contains(e.target) || btnSidebar.contains(e.target);
      if (!clickedInside && sidebar.classList.contains('mostrar')) {
        sidebar.classList.remove('mostrar');
      }
    });
  });

// CERRAR SESIÓN

const btnCerrarSesion = document.getElementById('cerrar-sesion');

if (btnCerrarSesion) {
  btnCerrarSesion.addEventListener('click', () => {
    fetch('/logout/')
      .then(() => {
        window.location.href = '/logout/';
      });
  });
}