const express = require('express');
const cors = require('cors'); // Importa el paquete cors

const { Sequelize, DataTypes, Op } = require('sequelize');

const app = express();
app.use(cors()); // Habilita CORS para todas las peticiones
app.use(express.json());

// --- 1. CONFIGURACIÓN DE LA BASE DE DATOS ---

const sequelize = new Sequelize('sirenadb', 'postgres', 'admin', {
    host: 'localhost',
    dialect: 'postgres',
    logging: console.log, // Muestra los logs de Sequelize en la consola
});

// --- 2. DEFINICIÓN DE MODELOS ---

// Modelo Pelicula
const Pelicula = sequelize.define('Pelicula', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    titulo: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    sinopsis: {
        type: DataTypes.TEXT,
    },
    duracionMin: {
        type: DataTypes.INTEGER,
    },
    clasificacion: {
        type: DataTypes.STRING,
    },
    generos: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
    },
    estado: {
        type: DataTypes.STRING,
        defaultValue: 'activo',
        allowNull: false,
    },
    fechaEstreno: {
        type: DataTypes.DATEONLY,
    },
}, {
    tableName: 'Peliculas', // Nombre de la tabla en la base de datos
    timestamps: true,
});

// Modelo Turno
const Turno = sequelize.define('Turno', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    peliculaId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Peliculas',
            key: 'id',
        },
        //onDelete: 'CASCADE',
    },
    sala: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    inicio: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    fin: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
    },
    idioma: {
        type: DataTypes.STRING,
    },
    formato: {
        type: DataTypes.STRING,
    },
    aforo: {
        type: DataTypes.INTEGER,
    },
    estado: {
        type: DataTypes.STRING,
        defaultValue: 'activo',
        allowNull: false,
    },
}, {
    tableName: 'Turnos',
    timestamps: true,
});

Pelicula.hasMany(Turno, { foreignKey: 'peliculaId', as: 'turnos' });
Turno.belongsTo(Pelicula, { foreignKey: 'peliculaId', as: 'pelicula' });

// Sincroniza modelos con la base de datos
(async () => {
    try {
        await sequelize.sync({ force: true }); // `force: true` borra y recrea las tablas
        console.log('Database synced!');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
})();

// --- 3. SERVIDOR EXPRESS Y ENDPOINTS ---

app.use(express.json());
app.use(cors());

// Middleware para manejar errores de forma estándar
function sendErrorResponse(res, statusCode, code, message, details = '') {
    res.status(statusCode).json({
        code,
        message,
        details,
    });
}

// ENDPOINTS PARA PELÍCULAS

// POST /api/peliculas (Crear una película)
app.post('/api/peliculas', async (req, res) => {
    try {
        const nuevaPelicula = await Pelicula.create(req.body);
        res.status(201).json({
            message: 'Película creada exitosamente.',
            data: nuevaPelicula,
        });
    } catch (error) {
        sendErrorResponse(res, 500, 'internal_error', 'Error al crear la película.', error.message);
    }
});

// GET /api/peliculas (Listar películas con filtros y paginación)
app.get('/api/peliculas', async (req, res) => {
    const { search, genero, estado, page = 1, pageSize = 10 } = req.query;
    const where = {};
    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    if (search) {
        where[Op.or] = [
            { titulo: { [Op.iLike]: `%${search}%` } },
            { sinopsis: { [Op.iLike]: `%${search}%` } },
        ];
    }
    if (genero) {
        where.generos = { [Op.contains]: [genero] };
    }
    if (estado) {
        where.estado = estado;
    }

    try {
        const { count, rows: peliculas } = await Pelicula.findAndCountAll({
            where,
            limit,
            offset,
        });
        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page, 10),
            data: peliculas,
        });
    } catch (error) {
        sendErrorResponse(res, 500, 'internal_error', 'Error al obtener las películas.', error.message);
    }
});

// GET /api/peliculas/:id (Obtener una película por ID)
app.get('/api/peliculas/:id', async (req, res) => {
    try {
        const pelicula = await Pelicula.findByPk(req.params.id);
        if (!pelicula) {
            return sendErrorResponse(res, 404, 'not_found', 'Película no encontrada.');
        }
        res.status(200).json({ data: pelicula });
    } catch (error) {
        sendErrorResponse(res, 500, 'internal_error', 'Error al obtener la película.', error.message);
    }
});

// PUT/PATCH /api/peliculas/:id (Actualizar una película)
app.put('/api/peliculas/:id', async (req, res) => {
    try {
        const [updated] = await Pelicula.update(req.body, {
            where: { id: req.params.id },
        });
        if (!updated) {
            return sendErrorResponse(res, 404, 'not_found', 'Película no encontrada.');
        }
        const peliculaActualizada = await Pelicula.findByPk(req.params.id);
        res.status(200).json({
            message: 'Película actualizada exitosamente.',
            data: peliculaActualizada,
        });
    } catch (error) {
        sendErrorResponse(res, 500, 'internal_error', 'Error al actualizar la película.', error.message);
    }
});

// DELETE /api/peliculas/:id (Soft-delete con cascada controlada)
app.delete('/api/peliculas/:id', async (req, res) => {
    try {
        const peliculaId = req.params.id;
        const transaction = await sequelize.transaction();

        const pelicula = await Pelicula.findByPk(peliculaId, { transaction });
        if (!pelicula) {
            await transaction.rollback();
            return sendErrorResponse(res, 404, 'not_found', 'Película no encontrada.');
        }

        // 1. Marcar la película como 'Eliminado'
        await pelicula.update({ estado: 'Eliminado' }, { transaction });

        // 2. Marcar todos los turnos asociados como 'Eliminado'
        await Turno.update(
            { estado: 'Eliminado' },
            {
                where: { peliculaId: peliculaId },
                transaction,
            }
        );

        await transaction.commit();
        res.status(200).json({ message: 'Película y turnos asociados marcados como eliminados.' });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error(error);
        sendErrorResponse(res, 500, 'internal_error', 'Error al eliminar la película.', error.message);
    }
});


// ENDPOINTS PARA TURNOS

// POST /api/turnos (Crear un turno)
app.post('/api/turnos', async (req, res) => {
    try {
        const { peliculaId, inicio, fin, sala, ...rest } = req.body;

        // Validar que el inicio sea anterior al fin del turno
        if (new Date(inicio) >= new Date(fin)) {
            return sendErrorResponse(res, 422, 'validation_error', 'La fecha de fin debe ser posterior a la de inicio.');
        }

        // Validar que la duración de la película quepa en el turno
        const pelicula = await Pelicula.findByPk(peliculaId);
        if (!pelicula || pelicula.estado === 'inactivo') {
            return sendErrorResponse(res, 400, 'invalid_input', 'La película asociada no existe o está inactiva.');
        }
        const duracionTurno = (new Date(fin) - new Date(inicio)) / 60000;
        if (pelicula.duracionMin > duracionTurno) {
            return sendErrorResponse(res, 422, 'validation_error', 'La duración de la película excede la del turno.');
        }

        // Validar solapamiento de turnos en la misma sala
        const solapamiento = await Turno.findOne({
            where: {
                sala,
                estado: 'Activo',
                [Op.and]: [
                    { inicio: { [Op.lt]: new Date(fin) } },
                    { fin: { [Op.gt]: new Date(inicio) } },
                ],
            },
        });
        if (solapamiento) {
            return sendErrorResponse(res, 400, 'solapamiento_error', 'Ya existe un turno en esta sala durante este horario.');
        }

        // Creación del turno de forma explícita
        const nuevoTurno = await Turno.create({
            peliculaId: peliculaId,
            inicio: inicio,
            fin: fin,
            sala: sala,
            // Los campos opcionales del formulario
            precio: rest.precio,
            idioma: rest.idioma,
            formato: rest.formato,
            aforo: rest.aforo,
            estado: 'activo'
        });

        res.status(201).json({
            message: 'Turno creado exitosamente.',
            data: nuevoTurno,
        });
    } catch (error) {
        sendErrorResponse(res, 500, 'internal_error', 'Error al crear el turno.', error.message);
    }
});

// GET /api/turnos (Listar turnos con filtros)
app.get('/api/turnos', async (req, res) => {
    const { peliculaId, sala, desde, hasta } = req.query;
    const where = {};

    if (peliculaId) {
        where.peliculaId = peliculaId;
    }
    if (sala) {
        where.sala = sala;
    }
    if (desde && hasta) {
        where.inicio = { [Op.gte]: new Date(desde) };
        where.fin = { [Op.lte]: new Date(hasta) };
    }

    try {
        const turnos = await Turno.findAll({
            where,
            include: [{ model: Pelicula, as: 'pelicula' }],
        });
        res.status(200).json({
            message: 'Turnos obtenidos exitosamente.',
            data: turnos,
        });
    } catch (error) {
        sendErrorResponse(res, 500, 'internal_error', 'Error al obtener los turnos.', error.message);
    }
});

// GET /api/turnos/:id (Obtener un turno por ID)
app.get('/api/turnos/:id', async (req, res) => {
    try {
        const turno = await Turno.findByPk(req.params.id);
        if (!turno) {
            return sendErrorResponse(res, 404, 'not_found', 'Turno no encontrado.');
        }
        res.status(200).json({ data: turno });
    } catch (error) {
        sendErrorResponse(res, 500, 'internal_error', 'Error al obtener el turno.', error.message);
    }
});

// PUT/PATCH /api/turnos/:id (Actualizar un turno)
app.put('/api/turnos/:id', async (req, res) => {
    try {
        const [updated] = await Turno.update(req.body, {
            where: { id: req.params.id },
        });
        if (!updated) {
            return sendErrorResponse(res, 404, 'not_found', 'Turno no encontrado.');
        }
        const turnoActualizado = await Turno.findByPk(req.params.id);
        res.status(200).json({
            message: 'Turno actualizado exitosamente.',
            data: turnoActualizado,
        });
    } catch (error) {
        sendErrorResponse(res, 500, 'internal_error', 'Error al actualizar el turno.', error.message);
    }
});

// DELETE /api/turnos/:id (Soft-delete)
app.delete('/api/turnos/:id', async (req, res) => {
    try {
        const turnoId = req.params.id;
        
        const turno = await Turno.findByPk(turnoId);
        if (!turno) {
            return sendErrorResponse(res, 404, 'not_found', 'Turno no encontrado.');
        }

        // Marcar el turno como 'Eliminado' en lugar de eliminarlo
        await turno.update({ estado: 'Eliminado' });

        res.status(200).json({ message: 'Turno marcado como eliminado.' });

    } catch (error) {
        console.error(error);
        sendErrorResponse(res, 500, 'internal_error', 'Error al eliminar el turno.', error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// POST /api/peliculas/:id/turnos:bulkCreate (Asignación masiva de turnos)
app.post('/api/peliculas/:id/turnos:bulkCreate', async (req, res) => {
    const { turnos } = req.body;
    const peliculaId = req.params.id;

    if (!turnos || !Array.isArray(turnos)) {
        return sendErrorResponse(res, 400, 'invalid_input', 'El cuerpo de la petición debe ser un array de turnos.');
    }

    try {
        const pelicula = await Pelicula.findByPk(peliculaId);
        if (!pelicula || pelicula.estado === 'inactivo') {
            return sendErrorResponse(res, 400, 'invalid_input', 'La película no existe o está inactiva.');
        }

        // Validación de cada turno antes de crearlos
        for (const turno of turnos) {
            const { inicio, fin, sala } = turno;
            if (new Date(inicio) >= new Date(fin)) {
                return sendErrorResponse(res, 422, 'validation_error', `Error de validación en un turno: La fecha de fin debe ser posterior a la de inicio.`);
            }

            const duracionTurno = (new Date(fin) - new Date(inicio)) / 60000;
            if (pelicula.duracionMin > duracionTurno) {
                return sendErrorResponse(res, 422, 'validation_error', `Error de validación en un turno: La duración de la película excede la del turno.`);
            }

            const solapamiento = await Turno.findOne({
                where: {
                    sala,
                    estado: 'Activo',
                    [Op.and]: [
                        { inicio: { [Op.lt]: new Date(fin) } },
                        { fin: { [Op.gt]: new Date(inicio) } },
                    ],
                },
            });
            if (solapamiento) {
                return sendErrorResponse(res, 400, 'solapamiento_error', `Error de solapamiento en la sala '${sala}'.`);
            }
        }

        const turnosConPeliculaId = turnos.map(turno => ({
            ...turno,
            peliculaId: parseInt(peliculaId, 10),
        }));

        const turnosCreados = await Turno.bulkCreate(turnosConPeliculaId, { returning: true });
        res.status(201).json({
            message: 'Turnos creados exitosamente.',
            data: turnosCreados,
        });
    } catch (error) {
        sendErrorResponse(res, 500, 'internal_error', 'Error al crear los turnos de forma masiva.', error.message);
    }
});