CREATE TABLE IF NOT EXISTS Peliculas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) UNIQUE NOT NULL,
    sinopsis TEXT,
    duracion_min INT,
    clasificacion VARCHAR(50),
    generos TEXT[],
    estado VARCHAR(20) DEFAULT 'activo' NOT NULL,
    fecha_estreno DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS Turnos (
    id SERIAL PRIMARY KEY,
    pelicula_id INT REFERENCES Peliculas(id) ON DELETE CASCADE,
    sala VARCHAR(50) NOT NULL,
    inicio TIMESTAMPTZ NOT NULL,
    fin TIMESTAMPTZ NOT NULL,
    precio DECIMAL(10, 2),
    idioma VARCHAR(20),
    formato VARCHAR(10),
    aforo INT,
    estado VARCHAR(20) DEFAULT 'activo' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Restricción para evitar solapamiento de turnos en la misma sala
    CONSTRAINT no_solapamiento_turnos EXCLUDE USING GIST (sala WITH =, TSTZRANGE(inicio, fin) WITH &&)
);