// ===== ADMIN PANEL JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const sidebar = document.getElementById('adminSidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('pageTitle');
    const searchInput = document.getElementById('searchMedicamentos');
    
    // Estado de la aplicación
    let currentSection = 'dashboard';
    let sidebarCollapsed = false;
    
    // ===== INICIALIZACIÓN =====
    initializeAdmin();
    
    function initializeAdmin() {
        setupSidebar();
        setupNavigation();
        setupSearch();
        setupAnimations();
        updateStats();
        
        // Detectar dispositivos móviles
        if (window.innerWidth <= 768) {
            collapseSidebar();
        }
    }
    
    // ===== SIDEBAR FUNCTIONALITY =====
    function setupSidebar() {
        sidebarToggle.addEventListener('click', toggleSidebar);
        
        // Cerrar sidebar en móvil cuando se hace click fuera
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                    if (sidebar.classList.contains('mobile-open')) {
                        sidebar.classList.remove('mobile-open');
                    }
                }
            }
        });
    }
    
    function toggleSidebar() {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('mobile-open');
        } else {
            sidebar.classList.toggle('collapsed');
            sidebarCollapsed = !sidebarCollapsed;
        }
    }
    
    function collapseSidebar() {
        if (window.innerWidth > 768) {
            sidebar.classList.add('collapsed');
            sidebarCollapsed = true;
        }
    }
    
    // ===== NAVIGATION =====
    function setupNavigation() {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Skip logout link
                if (link.id === 'logoutBtn') {
                    return;
                }
                
                const section = link.getAttribute('data-section');
                if (section) {
                    switchSection(section, link);
                }
            });
        });
    }
    
    function switchSection(sectionId, clickedLink) {
        // Update active states
        navLinks.forEach(link => link.classList.remove('active'));
        clickedLink.classList.add('active');
        
        // Hide all sections
        contentSections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId + 'Section');
        if (targetSection) {
            targetSection.style.display = 'block';
            setTimeout(() => {
                targetSection.classList.add('active');
            }, 10);
        }
        
        // Update page title
        updatePageTitle(sectionId);
        
        // Update current section
        currentSection = sectionId;
        
        // Close mobile sidebar
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('mobile-open');
        }
        
        // Load section specific data
        loadSectionData(sectionId);
    }
    
    function updatePageTitle(sectionId) {
        const titles = {
            dashboard: 'Dashboard',
            medicamentos: 'Medicamentos',
            inventario: 'Control de Inventario',
            pedidos: 'Gestión de Pedidos',
            usuarios: 'Gestión de Usuarios',
            reportes: 'Reportes y Analytics',
            configuracion: 'Configuración del Sistema'
        };
        
        pageTitle.textContent = titles[sectionId] || 'Panel de Administración';
    }
    
    // ===== SEARCH FUNCTIONALITY =====
    function setupSearch() {
        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleSearch, 300));
        }
    }
    
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        const tableRows = document.querySelectorAll('#medicamentosTable tbody tr');
        
        tableRows.forEach(row => {
            const medicineName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const medicineDesc = row.querySelector('td:nth-child(6)').textContent.toLowerCase();
            
            if (medicineName.includes(searchTerm) || medicineDesc.includes(searchTerm)) {
                row.style.display = '';
                row.classList.add('search-highlight');
            } else {
                row.style.display = 'none';
                row.classList.remove('search-highlight');
            }
        });
        
        // Remove highlight after delay
        setTimeout(() => {
            tableRows.forEach(row => row.classList.remove('search-highlight'));
        }, 2000);
    }
    
    // ===== ANIMATIONS =====
    function setupAnimations() {
        // Animate dashboard cards
        const dashboardCards = document.querySelectorAll('.dashboard-card');
        dashboardCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-in');
        });
        
        // Add hover effects to dashboard cards
        dashboardCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('hovered');
            });
            card.addEventListener('mouseleave', () => {
                card.classList.remove('hovered');
            });
        });
    }

    // ===== LOAD SECTION DATA =====
    function loadSectionData(sectionId) {
        // Placeholder for loading section-specific data
        // This could be an AJAX call to fetch data based on the section
        console.log(`Loading data for section: ${sectionId}`);
    }

    // ===== DEBOUNCE FUNCTION =====
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // ===== UPDATE STATS FUNCTION =====
    function updateStats() {
        // Placeholder for updating statistics on the dashboard
        console.log('Updating stats...');
    }
});
