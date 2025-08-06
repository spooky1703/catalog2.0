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