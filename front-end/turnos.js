// Constantes y selectores del DOM
const API_URL = 'http://localhost:3000/api';

const listaTurnosView = document.getElementById('lista-turnos-view');
const formTurnoView = document.getElementById('form-turno-view');

const peliculaTituloTurnos = document.getElementById('pelicula-titulo-turnos');
const tablaTurnosBody = document.querySelector('#tabla-turnos tbody');

const formTurno = document.getElementById('form-turno');
const turnoIdInput = document.getElementById('turno-id-input');
const turnoPeliculaIdInput = document.getElementById('turno-pelicula-id-input');
const salaInput = document.getElementById('sala-input');
const inicioInput = document.getElementById('inicio-input');
const finInput = document.getElementById('fin-input');

const btnNuevoTurno = document.getElementById('btn-nuevo-turno');
const btnCancelarTurno = document.getElementById('btn-cancelar-turno');
const btnVolverPeliculas = document.getElementById('btn-volver-peliculas');

let peliculaIdGlobal = null;

// Funciones para manejar la visibilidad de la interfaz
const showListaTurnos = () => {
    listaTurnosView.classList.remove('hidden');
    formTurnoView.classList.add('hidden');
};

const showFormTurno = () => {
    listaTurnosView.classList.add('hidden');
    formTurnoView.classList.remove('hidden');
    formTurno.reset();
};

const hideFormTurno = () => {
    showListaTurnos();
    formTurno.reset();
    turnoIdInput.value = '';
};

// Función para cargar los turnos de una película (AHORA FILTRA POR ESTADO)
const fetchTurnos = async (peliculaId) => {
    if (!peliculaId) return;

    try {
        const response = await fetch(`${API_URL}/turnos?peliculaId=${peliculaId}`);
        const data = await response.json();

        // Limpia la tabla
        tablaTurnosBody.innerHTML = '';

        if (data.data && data.data.length > 0) {
            // Filtra los turnos que no están en estado 'Eliminado'
            const turnosVisibles = data.data.filter(turno => turno.estado !== 'Eliminado');

            if (turnosVisibles.length > 0) {
                turnosVisibles.forEach(turno => {
                    const inicio = new Date(turno.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const fin = new Date(turno.fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${turno.id}</td>
                        <td>${turno.sala}</td>
                        <td>${inicio}</td>
                        <td>${fin}</td>
                        <td>${turno.estado}</td>
                        <td>
                            <button class="edit-btn" data-id="${turno.id}">✏️</button>
                            <button class="delete-btn" data-id="${turno.id}">🗑️</button>
                        </td>
                    `;
                    tablaTurnosBody.appendChild(row);
                });
            } else {
                tablaTurnosBody.innerHTML = '<tr><td colspan="6">No hay turnos activos para esta película.</td></tr>';
            }
        } else {
            tablaTurnosBody.innerHTML = '<tr><td colspan="6">No hay turnos registrados para esta película.</td></tr>';
        }
    } catch (error) {
        console.error('Error al obtener los turnos:', error);
        alert('Hubo un error al cargar los turnos.');
    }
};

// Manejador del clic en los botones de la tabla
tablaTurnosBody.addEventListener('click', async (e) => {
    const target = e.target;
    const turnoId = target.dataset.id;
    
    if (target.classList.contains('edit-btn')) {
        try {
            const response = await fetch(`${API_URL}/turnos/${turnoId}`);
            const { data: turno } = await response.json();

            turnoIdInput.value = turno.id;
            turnoPeliculaIdInput.value = turno.peliculaId;
            salaInput.value = turno.sala;
            
            // Formatear las fechas para el input datetime-local
            const inicio = new Date(turno.inicio);
            const fin = new Date(turno.fin);
            inicioInput.value = inicio.toISOString().slice(0, 16);
            finInput.value = fin.toISOString().slice(0, 16);

            showFormTurno();
        } catch (error) {
            console.error('Error al obtener datos del turno para edición:', error);
            alert('Hubo un error al cargar el turno para editar.');
        }
    } else if (target.classList.contains('delete-btn')) {
        if (confirm('¿Estás seguro de que quieres eliminar este turno?')) {
            try {
                // Envía una solicitud DELETE para realizar el soft-delete en el backend
                const response = await fetch(`${API_URL}/turnos/${turnoId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    alert('Turno eliminado correctamente.');
                    fetchTurnos(peliculaIdGlobal);
                } else {
                    const errorData = await response.json();
                    alert(`Error: ${errorData.message}`);
                }
            } catch (error) {
                console.error('Error al eliminar el turno:', error);
                alert('Hubo un error de conexión al eliminar el turno.');
            }
        }
    }
});

// Manejar el envío del formulario de turno (Crear o Actualizar)
formTurno.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const turnoId = turnoIdInput.value;
    const method = turnoId ? 'PUT' : 'POST';
    const url = turnoId ? `${API_URL}/turnos/${turnoId}` : `${API_URL}/turnos`;

    const turnoData = {
        peliculaId: parseInt(turnoPeliculaIdInput.value, 10),
        sala: salaInput.value,
        inicio: inicioInput.value,
        fin: finInput.value,
    };
    
    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(turnoData),
        });

        if (response.ok) {
            alert(`Turno ${turnoId ? 'actualizado' : 'creado'} correctamente.`);
            hideFormTurno();
            fetchTurnos(turnoData.peliculaId);
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.message}`);
        }

    } catch (error) {
        console.error(`Error al ${turnoId ? 'actualizar' : 'crear'} el turno:`, error);
        alert('Hubo un error de conexión al guardar el turno.');
    }
});

// Eventos de los botones de navegación
btnNuevoTurno.addEventListener('click', showFormTurno);
btnCancelarTurno.addEventListener('click', hideFormTurno);
btnVolverPeliculas.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Inicializa la vista al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    handleUrlParams();
});

// Función para manejar la lógica de la URL y cargar los datos iniciales
const handleUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const peliculaId = params.get('peliculaId');
    const peliculaTitulo = params.get('peliculaTitulo');

    if (peliculaId) {
        peliculaIdGlobal = peliculaId;
        peliculaTituloTurnos.textContent = peliculaTitulo ? decodeURIComponent(peliculaTitulo) : 'Título no disponible';
        turnoPeliculaIdInput.value = peliculaId;
        fetchTurnos(peliculaId);
        showListaTurnos();
    } else {
        alert('ID de película no proporcionado.');
        window.location.href = 'index.html';
    }
};