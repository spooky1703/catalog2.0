from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import sqlite3
import datetime
import os

app = Flask(__name__)
app.secret_key = 'tu_clave_secreta'
app.config['UPLOAD_FOLDER'] = 'static/uploads'

# Credenciales hardcodeadas
ADMIN_USER = 'admin'
ADMIN_PASS = 'admin123'

# Inyectar año actual en todas las plantillas
@app.context_processor
def inject_current_year():
    return {'current_year': datetime.datetime.now().year}

def get_db_connection():
    conn = sqlite3.connect('pharmacy.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    conn = get_db_connection()
    meds = conn.execute('SELECT * FROM medication').fetchall()
    conn.close()
    return render_template('index.html', meds=meds)

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
    
    # Convertir a lista de diccionarios
    medicamentos = [dict(med) for med in meds]
    
    return jsonify({
        'success': True,
        'data': medicamentos
    })

@app.route('/detalles/<int:id>', methods=['GET'])
def detalles_medicamento(id):
    conn = get_db_connection()
    med = conn.execute('SELECT * FROM medication WHERE id = ?', (id,)).fetchone()
    conn.close()
    
    if med:
        return jsonify({
            'success': True,
            'data': dict(med)
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Medicamento no encontrado'
        }), 404

@app.route('/login', methods=['GET', 'POST'])
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

@app.route('/logout')
def logout():
    session.pop('admin', None)
    return redirect(url_for('index'))

@app.route('/admin')
def admin_panel():
    if not session.get('admin'):
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    meds = conn.execute('SELECT * FROM medication').fetchall()
    conn.close()
    
    # Calcular estadísticas para el dashboard
    total_medicamentos = len(meds)
    total_stock_bajo = sum(1 for med in meds if med['stock'] < 10)
    
    return render_template(
        'admin.html', 
        meds=meds,
        total_medicamentos=total_medicamentos,
        total_stock_bajo=total_stock_bajo
    )

@app.route('/medication/new', methods=['GET', 'POST'])
def create_med():
    if not session.get('admin'):
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        name = request.form['name']
        desc = request.form.get('description', '')
        price = float(request.form['price'])
        stock = int(request.form['stock'])
        
        conn = get_db_connection()
        conn.execute('INSERT INTO medication (name, description, price, stock) VALUES (?, ?, ?, ?)',
                     (name, desc, price, stock))
        conn.commit()
        conn.close()
        
        flash('Medicamento creado exitosamente', 'success')
        return redirect(url_for('admin_panel'))
    
    return render_template('medication_form.html', action='new', med=None)

@app.route('/medication/edit/<int:id>', methods=['GET', 'POST'])
def edit_med(id):
    if not session.get('admin'):
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    med = conn.execute('SELECT * FROM medication WHERE id = ?', (id,)).fetchone()
    
    if request.method == 'POST':
        name = request.form['name']
        desc = request.form.get('description', '')
        price = float(request.form['price'])
        stock = int(request.form['stock'])
        
        conn.execute('UPDATE medication SET name=?, description=?, price=?, stock=? WHERE id=?',
                     (name, desc, price, stock, id))
        conn.commit()
        conn.close()
        
        flash('Medicamento actualizado exitosamente', 'success')
        return redirect(url_for('admin_panel'))
    
    conn.close()
    return render_template('medication_form.html', action='edit', med=med)

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

if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    app.run(debug=True)