/**
 * JavaScript principal para el catálogo de farmacia
 * Maneja la búsqueda, visualización y interacciones del cliente
 */

class FarmaciaCatalogo {
    constructor() {
        this.apiUrl = '/buscar';
        this.medicamentos = [];
        this.medicamentosFiltrados = [];
        this.terminoBusqueda = '';
        this.timeoutBusqueda = null;
        
        this.initializeElements();
        this.bindEvents();
        this.cargarMedicamentos();
    }

    /**
     * Inicializa los elementos del DOM
     */
    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.searchSuggestions = document.getElementById('searchSuggestions');
        this.resultadosGrid = document.getElementById('resultadosGrid');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.noResultados = document.getElementById('noResultados');
        this.resultadosTitle = document.getElementById('resultadosTitle');
        this.sortSelect = document.getElementById('sortSelect');
        this.modal = document.getElementById('modalDetalles');
        this.modalContent = document.getElementById('modalContent');
        this.modalTitle = document.getElementById('modalTitle');
        this.closeModal = document.getElementById('closeModal');
    }

    /**
     * Vincula eventos a los elementos
     */
    bindEvents() {
        // Eventos de búsqueda
        this.searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.realizarBusqueda();
            }
        });
        this.searchBtn.addEventListener('click', () => this.realizarBusqueda());

        // Eventos de ordenamiento
        this.sortSelect.addEventListener('change', (e) => this.ordenarResultados(e.target.value));

        // Eventos del modal
        this.closeModal.addEventListener('click', () => this.cerrarModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.cerrarModal();
            }
        });

        // Cerrar modal con escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.cerrarModal();
            }
        });

        // Ocultar sugerencias al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.ocultarSugerencias();
            }
        });

        // Smooth scroll para navegación
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Maneja la entrada de texto en el buscador
     */
    handleSearchInput(e) {
        const valor = e.target.value.trim();
        
        // Limpiar timeout anterior
        if (this.timeoutBusqueda) {
            clearTimeout(this.timeoutBusqueda);
        }

        // Si el campo está vacío, mostrar todos los medicamentos
        if (valor === '') {
            this.ocultarSugerencias();
            this.medicamentosFiltrados = [...this.medicamentos];
            this.mostrarResultados();
            this.actualizarTitulo('');
            return;
        }

        // Buscar con debounce
        this.timeoutBusqueda = setTimeout(() => {
            this.buscarSugerencias(valor);
        }, 300);
    }

    /**
     * Busca sugerencias mientras el usuario escribe
     */
    buscarSugerencias(termino) {
        if (termino.length < 2) {
            this.ocultarSugerencias();
            return;
        }
    
        try {
            // CAMBIAR: nombre -> name, descripcion -> description
            const sugerencias = this.medicamentos.filter(med => 
                med.name.toLowerCase().includes(termino.toLowerCase()) ||
                (med.description && med.description.toLowerCase().includes(termino.toLowerCase()))
            ).slice(0, 5);
    
            this.mostrarSugerencias(sugerencias, termino);
        } catch (error) {
            console.error('Error al buscar sugerencias:', error);
        }
    }

    /**
     * Muestra las sugerencias de búsqueda
     */
    mostrarSugerencias(sugerencias, termino) {
        if (sugerencias.length === 0) {
            this.ocultarSugerencias();
            return;
        }

        this.searchSuggestions.innerHTML = '';
        
        sugerencias.forEach(medicamento => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            
            // Resaltar el término de búsqueda
            const nombreResaltado = this.resaltarTexto(medicamento.nombre, termino);
            
            item.innerHTML = `
                <div>
                    <strong>${nombreResaltado}</strong>
                    <div style="font-size: 0.9em; color: #666;">$${parseFloat(medicamento.precio).toFixed(2)}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.searchInput.value = medicamento.nombre;
                this.ocultarSugerencias();
                this.realizarBusqueda();
            });
            
            this.searchSuggestions.appendChild(item);
        });

        this.searchSuggestions.style.display = 'block';
    }

    /**
     * Oculta las sugerencias
     */
    ocultarSugerencias() {
        this.searchSuggestions.style.display = 'none';
    }

    /**
     * Resalta el texto de búsqueda en los resultados
     */
    resaltarTexto(texto, termino) {
        if (!termino) return texto;
        
        const regex = new RegExp(`(${termino})`, 'gi');
        return texto.replace(regex, '<mark style="background: #f39c12; padding: 2px;">$1</mark>');
    }

    /**
     * Realiza la búsqueda principal
     */
    async realizarBusqueda() {
        const termino = this.searchInput.value.trim();
        this.terminoBusqueda = termino;
        this.ocultarSugerencias();
        
        this.mostrarCargando();

        try {
            const response = await fetch(`${this.apiUrl}?q=${encodeURIComponent(termino)}`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.medicamentosFiltrados = data.data || [];
                this.mostrarResultados();
                this.actualizarTitulo(termino);
                
                // Scroll hacia los resultados
                document.getElementById('catalogo').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                throw new Error(data.error || 'Error en la búsqueda');
            }
        } catch (error) {
            console.error('Error en la búsqueda:', error);
            this.mostrarError('Error al realizar la búsqueda. Intenta nuevamente.');
        } finally {
            this.ocultarCargando();
        }
    }

    /**
     * Carga todos los medicamentos al iniciar
     */
    async cargarMedicamentos() {
        this.mostrarCargando();
        
        try {
            const response = await fetch(this.apiUrl);
            const data = await response.json();
            
            if (data.success) {
                // Asegurarse que data.data es un array
                console.log('Medicamentos cargados:', data.data);
                this.medicamentos = data.data || [];
                this.medicamentosFiltrados = [...this.medicamentos];
                this.mostrarResultados();
            } else {
                throw new Error(data.error || 'Error al cargar medicamentos');
            }
        } catch (error) {
            console.error('Error al cargar medicamentos:', error);
            this.mostrarError('Error al cargar el catálogo. Recarga la página.');
        } finally {
            this.ocultarCargando();
        }
    }

    /**
     * Muestra los resultados en el grid
     */
    mostrarResultados() {
        this.resultadosGrid.innerHTML = '';
        
        if (this.medicamentosFiltrados.length === 0) {
            this.noResultados.style.display = 'block';
            return;
        }

        this.noResultados.style.display = 'none';

        this.medicamentosFiltrados.forEach(medicamento => {
            const card = this.crearTarjetaMedicamento(medicamento);
            this.resultadosGrid.appendChild(card);
        });

        // Animación de entrada
        this.animarTarjetas();
    }

    /**
     * Crea una tarjeta de medicamento
     */
    crearTarjetaMedicamento(medicamento) {
        const card = document.createElement('div');
        card.className = 'medicamento-card';
        card.dataset.id = medicamento.id;
        card.dataset.name = medicamento.name.toLowerCase(); // Cambiar 'nombre' a 'name'
        card.dataset.price = medicamento.price;
        card.dataset.stock = medicamento.stock;
        
        const stock = parseInt(medicamento.stock) || 0;
        let stockClass = 'stock-badge';
        let stockText = 'Disponible';
        
        if (stock === 0) {
            stockClass += ' out';
            stockText = 'Agotado';
        } else if (stock < 10) {
            stockClass += ' low';
            stockText = 'Pocas unidades';
        }
    
        const nombreResaltado = this.resaltarTexto(medicamento.name, this.terminoBusqueda); // Cambiar 'nombre' a 'name'
        const descripcionResaltada = medicamento.description ? 
            this.resaltarTexto(medicamento.description, this.terminoBusqueda) : '';
        card.innerHTML = `
            <div class="medicamento-header">
                <h3 class="medicamento-nombre">${nombreResaltado}</h3>
                <div class="medicamento-precio">$${parseFloat(medicamento.price).toFixed(2)}</div>
            </div>
            ${descripcionResaltada ? `<p class="medicamento-descripcion">${descripcionResaltada}</p>` : ''}
            <div class="medicamento-footer">
                <span class="${stockClass}">${stockText}</span>
                <button class="ver-detalles">
                    <i class="fas fa-info-circle"></i> Ver detalles
                </button>
            </div>
        `;
    
        // Agregar evento al botón de detalles
        card.querySelector('.ver-detalles').addEventListener('click', () => {
            this.mostrarDetalles(medicamento.id);
        });
    
        return card;
    }
    

    /**
     * Anima las tarjetas al aparecer
     */
    animarTarjetas() {
        const cards = document.querySelectorAll('.medicamento-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    /**
     * Ordena los resultados según el criterio seleccionado
     */
    ordenarResultados(criterio) {
        switch (criterio) {
            case 'nombre':
                this.medicamentosFiltrados.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'precio_asc':
                this.medicamentosFiltrados.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                break;
            case 'precio_desc':
                this.medicamentosFiltrados.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                break;
        }
        
        this.mostrarResultados();
    }

    /**
     * Muestra los detalles de un medicamento en modal
     */
    async mostrarDetalles(id) {
        try {
            const response = await fetch(`/detalles/${id}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                this.mostrarModalDetalles(data.data);
            } else {
                throw new Error('Medicamento no encontrado');
            }
        } catch (error) {
            console.error('Error al cargar detalles:', error);
            this.mostrarError('Error al cargar los detalles del medicamento');
        }
    }

    /**
     * Muestra el modal con detalles del medicamento
     */
    mostrarModalDetalles(medicamento) {
        const stock = parseInt(medicamento.stock) || 0;
        let stockInfo = '';
        let stockClass = '';

        if (stock === 0) {
            stockInfo = '<span style="color: #e74c3c;"><i class="fas fa-times-circle"></i> Producto agotado</span>';
            stockClass = 'out';
        } else if (stock < 10) {
            stockInfo = `<span style="color: #f39c12;"><i class="fas fa-exclamation-triangle"></i> Pocas unidades (${stock} disponibles)</span>`;
            stockClass = 'low';
        } else {
            stockInfo = `<span style="color: #27ae60;"><i class="fas fa-check-circle"></i> ${stock} unidades disponibles</span>`;
            stockClass = 'available';
        }

        this.modalTitle.textContent = medicamento.name;
        this.modalContent.innerHTML = `
            <div class="detalle-medicamento">
                <div class="detalle-header">
                    <h3>${medicamento.name}</h3>
                    <div class="detalle-precio">$${parseFloat(medicamento.price).toFixed(2)}</div>
                </div>
                
                ${medicamento.description ? `
                    <div class="detalle-seccion">
                        <h4><i class="fas fa-info-circle"></i> Descripción</h4>
                        <p>${medicamento.description}</p>
                    </div>
                ` : ''}
                
                <div class="detalle-seccion">
                    <h4><i class="fas fa-warehouse"></i> Disponibilidad</h4>
                    <p>${stockInfo}</p>
                </div>
                
                <div class="detalle-info">
                    <div class="info-item">
                        <strong>ID del producto:</strong> ${medicamento.id}
                    </div>
                    <div class="info-item">
                        <strong>Precio unitario:</strong> ${parseFloat(medicamento.price).toFixed(2)}
                    </div>
                </div>
                
                <div class="detalle-acciones">
                    <button class="btn-contacto" onclick="farmacia.contactarFarmacia('${medicamento.name}')">
                        <i class="fas fa-phone"></i> Consultar disponibilidad
                    </button>
                </div>
            </div>
            
            <style>
                .detalle-medicamento {
                    max-width: 100%;
                }
                
                .detalle-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #e1e8ed;
                }
                
                .detalle-header h3 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 1.5rem;
                }
                
                .detalle-precio {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #27ae60;
                }
                
                .detalle-seccion {
                    margin-bottom: 1.5rem;
                }
                
                .detalle-seccion h4 {
                    color: #2c5aa0;
                    margin-bottom: 0.5rem;
                    font-size: 1.1rem;
                }
                
                .detalle-seccion h4 i {
                    margin-right: 0.5rem;
                }
                
                .detalle-info {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 8px;
                    margin: 1.5rem 0;
                }
                
                .info-item {
                    margin-bottom: 0.5rem;
                }
                
                .detalle-acciones {
                    text-align: center;
                    margin-top: 2rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e1e8ed;
                }
                
                .btn-contacto {
                    background: linear-gradient(135deg, #2c5aa0, #4a90a4);
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 25px;
                    font-size: 1.1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-weight: 500;
                }
                
                .btn-contacto:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 20px rgba(44, 90, 160, 0.3);
                }
                
                @media (max-width: 768px) {
                    .detalle-header {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }
                    
                    .detalle-precio {
                        font-size: 1.8rem;
                    }
                }
            </style>
        `;

        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Cierra el modal
     */
    cerrarModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    /**
     * Simula contacto con la farmacia
     */
    contactarFarmacia(nombreMedicamento) {
        const mensaje = `Hola, me gustaría consultar sobre la disponibilidad de ${nombreMedicamento}`;
        const numeroWhatsApp = '+5214421234567'; // Cambiar por el número real
        const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
        
        // Abrir WhatsApp o mostrar información de contacto
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            window.open(url, '_blank');
        } else {
            // Para desktop, mostrar información de contacto
            alert(`Para consultar sobre ${nombreMedicamento}, puedes contactarnos:\n\nTeléfono: +52 442 123 4567\nEmail: info@farmaciadigital.com\n\nO escanea el código QR para WhatsApp`);
        }
    }

    /**
     * Actualiza el título de resultados
     */
    actualizarTitulo(termino) {
        if (termino) {
            this.resultadosTitle.textContent = `Resultados para "${termino}" (${this.medicamentosFiltrados.length})`;
        } else {
            this.resultadosTitle.textContent = `Medicamentos Disponibles (${this.medicamentosFiltrados.length})`;
        }
    }

    /**
     * Muestra el indicador de carga
     */
    mostrarCargando() {
        this.loadingSpinner.style.display = 'block';
        this.resultadosGrid.style.display = 'none';
        this.noResultados.style.display = 'none';
    }

    /**
     * Oculta el indicador de carga
     */
    ocultarCargando() {
        this.loadingSpinner.style.display = 'none';
        this.resultadosGrid.style.display = 'grid';
    }

    /**
     * Muestra un mensaje de error
     */
    mostrarError(mensaje) {
        this.resultadosGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <h3>Error</h3>
                <p>${mensaje}</p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Recargar página
                </button>
            </div>
        `;
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Crear instancia global para acceso desde onclick
    window.farmacia = new FarmaciaCatalogo();
    
    // Agregar algunos efectos adicionales
    agregarEfectosAdicionales();
});

/**
 * Efectos adicionales para mejorar la experiencia
 */
function agregarEfectosAdicionales() {
    // Efecto parallax suave en el hero
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    // Animación de aparición para elementos al hacer scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar elementos que necesitan animación
    document.querySelectorAll('.medicamento-card, .footer-section').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });

    // Efecto de escritura en el título del hero
    const heroTitle = document.querySelector('.hero h2');
    if (heroTitle) {
        const texto = heroTitle.textContent;
        heroTitle.textContent = '';
        let i = 0;
        
        const typeWriter = function() {
            if (i < texto.length) {
                heroTitle.textContent += texto.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        };
        
        setTimeout(typeWriter, 500);
    }

    // Preloader simple
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });
}