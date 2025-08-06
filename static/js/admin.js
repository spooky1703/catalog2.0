/**
 * JavaScript para el panel de administración
 * Maneja la lógica del CRUD de medicamentos
 */

class AdminPanel {
    constructor() {
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.sidebar = document.querySelector('.admin-sidebar');
        this.navLinks = document.querySelectorAll('.sidebar-nav a');
        this.sections = document.querySelectorAll('.content-section');
        this.pageTitle = document.getElementById('pageTitle');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        this.medicamentosTable = document.getElementById('medicamentosTable').querySelector('tbody');
        this.addMedicamentoBtn = document.getElementById('addMedicamentoBtn');
        
        this.bindEvents();
    }

    bindEvents() {
        // Toggle sidebar
        this.sidebarToggle.addEventListener('click', () => {
            this.sidebar.classList.toggle('collapsed');
            document.querySelector('.admin-main').classList.toggle('expanded');
        });

        // Navegación
        this.navLinks.forEach(link => {
            if (link.id !== 'logoutBtn') {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = link.getAttribute('data-section');
                    this.showSection(section);
                });
            }
        });

        // Confirmación antes de eliminar
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                if (!confirm('¿Estás seguro de eliminar este medicamento?')) {
                    e.preventDefault();
                }
            });
        });
    }

    showSection(sectionName) {
        // Ocultar todas las secciones
        this.sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostrar la sección seleccionada
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.pageTitle.textContent = document.querySelector(`[data-section="${sectionName}"] span`).textContent;
        }
        
        // Actualizar el menú activo
        this.navLinks.forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
    
    // Toggle sidebar en móviles
    const menuToggle = document.getElementById('sidebarToggle');
    if (window.innerWidth < 768) {
        document.querySelector('.admin-sidebar').classList.add('collapsed');
        document.querySelector('.admin-main').classList.add('expanded');
    }
    
    menuToggle.addEventListener('click', function() {
        document.querySelector('.admin-sidebar').classList.toggle('collapsed');
        document.querySelector('.admin-main').classList.toggle('expanded');
    });
});