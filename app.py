from flask import Flask, render_template, request, redirect, url_for, session, flash
import sqlite3
import datetime

app = Flask(__name__)
app.secret_key = 'tu_clave_secreta'

# Credenciales hardcodeadas
ADMIN_USER = 'admin'
ADMIN_PASS = 'password123'

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
    show_secret = request.args.get('admin') == 'true'
    return render_template('index.html', meds=meds, show_secret=show_secret)

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
    return render_template('admin.html', meds=meds)

@app.route('/medication/new', methods=['GET', 'POST'])
def create_med():
    if not session.get('admin'):
        return redirect(url_for('login'))
    if request.method == 'POST':
        name = request.form['name']
        desc = request.form['description']
        price = float(request.form['price'])
        stock = int(request.form['stock'])
        conn = get_db_connection()
        conn.execute('INSERT INTO medication (name, description, price, stock) VALUES (?, ?, ?, ?)',
                     (name, desc, price, stock))
        conn.commit()
        conn.close()
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
        desc = request.form['description']
        price = float(request.form['price'])
        stock = int(request.form['stock'])
        conn.execute('UPDATE medication SET name=?, description=?, price=?, stock=? WHERE id=?',
                     (name, desc, price, stock, id))
        conn.commit()
        conn.close()
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
    return redirect(url_for('admin_panel'))

if __name__ == '__main__':
    app.run(debug=True)