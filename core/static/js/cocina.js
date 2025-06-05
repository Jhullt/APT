// MENU HAMBURGUESA

document.addEventListener('DOMContentLoaded', () => {
    const btnSidebar = document.getElementById('btn-sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
  
    btnSidebar.addEventListener('click', () => {
      sidebar.classList.toggle('mostrar');
    });
  
    // Cerrar haciendo clic fuera del sidebar
    document.addEventListener('click', (e) => {
      const clickedInside = sidebar.contains(e.target) || btnSidebar.contains(e.target);
      if (!clickedInside && sidebar.classList.contains('mostrar')) {
        sidebar.classList.remove('mostrar');
      }
    });
  });