# Catálogo Online de Farmacia

## Descripción

Este proyecto es un catálogo online de farmacia que permite a los usuarios buscar y ver detalles de medicamentos. Además, incluye un panel de administración para gestionar los medicamentos en la base de datos. La aplicación está construida con Flask y utiliza SQLite como base de datos.

## Estructura del Proyecto

```plaintext
├── app.py                 # Punto de entrada principal de la aplicación
├── database_init.py       # Script de inicialización de la base de datos
├── requirements.txt       # Dependencias de Python
├── Procfile               # Configuración para despliegue en Heroku
├── templates/             # Plantillas HTML
│   ├── base.html          # Plantilla base para todas las páginas
│   ├── index.html         # Página principal del catálogo
│   ├── login.html         # Formulario de inicio de sesión
│   ├── admin.html         # Panel de administración
│   └── medication_form.html # Formulario para crear/editar medicamentos
└── static/                # Archivos estáticos
    ├── css/               # Hojas de estilo
    │   ├── style.css      # Estilos para el catálogo público
    │   └── admin.css      # Estilos para el panel de administración
    └── js/                # Scripts JavaScript
        ├── main.js        # Lógica del lado del cliente para el catálogo
        └── admin.js       # Funcionalidad del panel de administración
```

## Funcionamiento de `app.py`

### Conexión con la Base de Datos

```python
def get_db_connection():
    conn = sqlite3.connect('pharmacy.db')
    conn.row_factory = sqlite3.Row  # Permite acceder a las columnas por nombre
    return conn
```

### Rutas Públicas (sin autenticación)

#### Página Principal

```python
@app.route('/')
def index():
    conn = get_db_connection()
    meds = conn.execute('SELECT * FROM medication').fetchall()
    conn.close()
    return render_template('index.html', meds=meds)
```

#### Búsqueda de Medicamentos

```python
@app.route('/buscar', methods=['GET'])
def buscar_medicamentos():
    termino = request.args.get('q', '')
    conn = get_db_connection()
    
    if termino:
        query = "SELECT * FROM medication WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ?"
        params = (f'%{termino.lower()}%', f'%{termino.lower()}%')
        meds = conn.execute(query, params).fetchall()
    else:
        meds = conn.execute('SELECT * FROM medication').fetchall()
    
    conn.close()
    medicamentos = [dict(med) for med in meds]
    return jsonify({'success': True, 'data': medicamentos})
```

#### Detalles de Medicamento

```python
@app.route('/detalles/<int:id>', methods=['GET'])
def detalles_medicamento(id):
    conn = get_db_connection()
    med = conn.execute('SELECT * FROM medication WHERE id = ?', (id,)).fetchone()
    conn.close()
    
    if med:
        return jsonify({'success': True, 'data': dict(med)})
    else:
        return jsonify({'success': False, 'error': 'Medicamento no encontrado'}), 404
```

### Sistema de Autenticación

#### Login

```python
@app.route('/login', methods=['不懂GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if username == ADMIN_USER and password == ADMIN_PASS:
            session['admin'] = True
            return redirect(url_for('admin_panel'))
        else:
            flash('Credenciales inválidas', 'danger')
    return render_template('login.html')
```

#### Logout

```python
@app.route('/logout')
def logout():
    session.pop('admin', None)
    return redirect(url_for('index'))
```

### Panel de Administración

#### Dashboard Principal

```python
@app.route('/admin')
def admin_panel():
    if not session.get('admin'):
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    meds = conn.execute('SELECT * FROM medication').fetchall()
    conn.close()
    
    # Calcular estadísticas
    total_medicamentos = len(meds)
    total_stock_bajo = sum(1 for med in meds if med['stock'] < 10)
    
    return render_template('admin.html', 
        meds=meds,
        total_medicamentos=total_medicamentos,
        total_stock_bajo=total_stock_bajo
    )
```

#### Operaciones CRUD para Medicamentos

##### Crear Nuevo Medicamento

```python
@app.route('/medication/new', methods=['GET', 'POST'])
def create_med():
    if not session.get('admin'):
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        # Obtener datos del formulario
        name = request.form['name']
        desc = request.form.get('description', '')
        price = float(request.form['price'])
        stock = int(request.form['stock'])
        
        # Insertar en base de datos
        conn = get_db_connection()
        conn.execute('INSERT INTO medication (name, description, price, stock) VALUES (?, ?, ?, ?)',
                     (name, desc, price, stock))
        conn.commit()
        conn.close()
        
        flash('Medicamento creado exitosamente', 'success')
        return redirect(url_for('admin_panel'))
    
    return render_template('medication_form.html', action='new', med=None)
```

##### Editar Medicamento Existente

```python
@app.route('/medication/edit/<int:id>', methods=['GET', 'POST'])
def edit_med(id):
    if not session.get('admin'):
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    med = conn.execute('SELECT * FROM medication WHERE id = ?', (id,)).fetchone()
    
    if request.method == 'POST':
        # Obtener datos actualizados
        name = request.form['name']
        desc = request.form.get('description', '')
        price = float(request.form['price'])
        stock = int(request.form['stock'])
        
        # Actualizar en base de datos
        conn.execute('UPDATE medication SET name=?, description=?, price=?, stock=? WHERE id=?',
                     (name, desc, price, stock, id))
        conn.commit()
        conn.close()
        
        flash('Medicamento actualizado exitosamente', 'success')
        return redirect(url_for('admin_panel'))
    
    conn.close()
    return render_template('medication_form.html', action='edit', med=med)
```

##### Eliminar Medicamento

```python
@app.route('/medication/delete/<int:id>', methods=['POST'])
def delete_med(id):
    if not session.get('admin'):
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    conn.execute('DELETE FROM medication WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    
    flash('Medicamento eliminado exitosamente', 'success')
    return redirect(url_for('admin_panel'))
```

## Funcionamiento de `database_init.py`

### Inicialización de la Base de Datos

```python
import sqlite3

conn = sqlite3.connect('pharmacy.db')
c = conn.cursor()

c.execute('''
CREATE TABLE IF NOT EXISTS medication (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL
)
''')

conn.commit()
conn.close()
print("Base de datos inicializada.")
```

## Flujo de Datos entre Componentes

```
sequenceDiagram
    participant Usuario
    participant Frontend
    participant app.py
    participant DB
    
    Usuario->>Frontend: Acción (buscar, ver detalles, etc.)
    Frontend->>app.py: Solicitud HTTP (GET/POST)
    app.py->>DB: Consulta SQL
    DB-->>app.py: Resultados
    app.py-->>Frontend: Respuesta (HTML/JSON)
    Frontend-->>Usuario: Muestra resultados
```

## Estructura de la Base de Datos

### Tabla `medication`

| Columna     | Tipo    | Descripción                      |
|-------------|---------|----------------------------------|
| id          | INTEGER | Identificador único (PK, AI)     |
| name        | TEXT    | Nombre del medicamento (NOT NULL)|
| description | TEXT    | Descripción detallada (opcional) |
| price       | REAL    | Precio unitario (NOT NULL)       |
| stock       | INTEGER | Cantidad disponible (NOT NULL)   |

### Ejemplo de Operaciones SQL

- **Insertar nuevo medicamento:**

  ```sql
  INSERT INTO medication (name, description, price, stock)
  VALUES ('Paracetamol 500mg', 'Analgésico y antipirético', 25.50, 100);
  ```

- **Actualizar stock:**

  ```sql
  UPDATE medication SET stock = 75 WHERE id = 1;
  ```

- **Obtener medicamentos con bajo stock:**

  ```sql
  SELECT * FROM medication WHERE stock < 10;
  ```

- **Buscar por nombre o descripción:**

  ```sql
  SELECT * FROM medication 
 Hannah WHERE LOWER(name) LIKE '%paracetamol%' 
     OR LOWER(description) LIKE '%analgésico%';
  ```

## Seguridad y Validaciones

- **Protección de rutas administrativas:**

  ```python
  if not session.get('admin'):
      return redirect(url_for('login'))
  ```

- **Validación de tipos de datos:**

  ```python
  price = float(request.form['price'])
  stock = int(request.form['stock'])
  ```

- **Protección contra inyección SQL:**

  ```python
  conn.execute('SELECT * FROM medication WHERE id = ?', (id,))
  ```

- **Manejo de errores básico:**

  ```python
  med = conn.execute(...).fetchone()
  if med:
      # Procesar
  else:
      return jsonify({'success': False, 'error': 'No encontrado'}), 404
  ```

## Flujo de Trabajo en el Panel de Administración

1. **Inicio de sesión:**
   - Verificación de credenciales
   - Creación de sesión

2. **Dashboard principal:**
   - Visualización de estadísticas
   - Listado completo de medicamentos

3. **Gestión de medicamentos:**
   - Creación: Formulario → INSERT
   - Edición: Formulario prellenado → UPDATE
   - Eliminación: Confirmación → DELETE

4. **Monitoreo de inventario:**
   - Identificación de productos con bajo stock
   - Alertas visuales en la interfaz

## Características Clave

- **Búsqueda en tiempo real:** Implementada con AJAX y SQL LIKE
- **Interfaz responsive:** Adaptada para móviles y escritorio
- **CRUD completo:** Para gestión de medicamentos
- **Autenticación de sesión:** Para acceso administrativo
- **API básica:** Endpoints para búsqueda y detalles
- **Sistema de notificaciones:** Usando flash messages
- **Diseño modular:** Separación clara entre frontend y backend

## Instrucciones para Ejecutar la Aplicación

1. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Inicializar la base de datos:**
   ```bash
   python database_init.py
   ```

3. **Ejecutar la aplicación:**
   ```bash
   python app.py
   ```

4. **Acceder a la aplicación:**
   - Abre tu navegador y ve a `http://localhost:5000`

## Notas Adicionales

- Asegúrate de tener Python y pip instalados en tu sistema.
- Para desplegar en Heroku, sigue las instrucciones en el archivo `Procfile`.