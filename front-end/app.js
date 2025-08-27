document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';

    // Elementos del DOM para la vista de películas
    const peliculasContainer = document.getElementById('peliculas-container');
    const formPeliculaContainer = document.getElementById('form-pelicula-container');
    const btnNuevaPelicula = document.getElementById('btn-nueva-pelicula');
    const btnCancelarPelicula = document.getElementById('btn-cancelar-pelicula');
    const formPelicula = document.getElementById('form-pelicula');
    const tablaPeliculasBody = document.querySelector('#tabla-peliculas tbody');
    const formTitle = document.getElementById('form-title');
    const idInput = document.getElementById('id-input');
    const tituloInput = document.getElementById('titulo-input');
    const fechaEstrenoInput = document.getElementById('fecha-estreno-input');
    const sinopsisInput = document.getElementById('sinopsis-input');
    const duracionMinInput = document.getElementById('duracion-min-input');
    const clasificacionInput = document.getElementById('clasificacion-input');
    const generosInput = document.getElementById('generos-input');

    // Manejar visibilidad del formulario de película
    function showPeliculaForm() {
        peliculasContainer.classList.add('hidden');
        formPeliculaContainer.classList.remove('hidden');
    }

    function hidePeliculaForm() {
        peliculasContainer.classList.remove('hidden');
        formPeliculaContainer.classList.add('hidden');
        formPelicula.reset();
        idInput.value = '';
        formTitle.textContent = 'Nueva película';
    }

    // Eventos de los botones
    btnNuevaPelicula.addEventListener('click', () => {
        hidePeliculaForm();
        formTitle.textContent = 'Nueva película';
        showPeliculaForm();
    });

    btnCancelarPelicula.addEventListener('click', () => {
        hidePeliculaForm();
        fetchPeliculas();
    });

    // Función para cargar películas (AHORA FILTRA POR ESTADO 'Eliminado')
    async function fetchPeliculas() {
        try {
            const response = await fetch(`${API_URL}/peliculas`);
            const { data } = await response.json();
            
            // Filtra las películas que no tienen el estado 'Eliminado'
            const peliculasVisibles = data.filter(pelicula => pelicula.estado !== 'Eliminado');

            tablaPeliculasBody.innerHTML = '';
            peliculasVisibles.forEach(pelicula => {
                const row = tablaPeliculasBody.insertRow();
                const isActivo = pelicula.estado === 'Activo';
                const lockIcon = isActivo ? '🔒' : '🔓';
                const lockClass = isActivo ? 'lock-btn' : 'unlock-btn';
                row.innerHTML = `
                    <td>${pelicula.id}</td>
                    <td>${pelicula.titulo}</td>
                    <td>${pelicula.fechaEstreno || 'N/A'}</td>
                    <td>${pelicula.estado}</td>
                    <td class="acciones">
                        <button class="edit-btn" data-id="${pelicula.id}">✏️</button>
                        <button class="assign-btn" data-id="${pelicula.id}" data-titulo="${pelicula.titulo}">🎬</button>
                        <button class="${lockClass}" data-id="${pelicula.id}">${lockIcon}</button>
                        <button class="delete-btn" data-id="${pelicula.id}">🗑️</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error al cargar las películas:', error);
        }
    }

    // Manejar el clic en los botones de la tabla de películas
    tablaPeliculasBody.addEventListener('click', async (e) => {
        const target = e.target;
        const peliculaId = target.dataset.id;
        
        if (target.classList.contains('edit-btn')) {
            try {
                const response = await fetch(`${API_URL}/peliculas/${peliculaId}`);
                const { data } = await response.json();

                idInput.value = data.id;
                tituloInput.value = data.titulo;
                fechaEstrenoInput.value = data.fechaEstreno;
                sinopsisInput.value = data.sinopsis;
                duracionMinInput.value = data.duracionMin ? parseInt(duracionMinInput.value, 10) : null;
                clasificacionInput.value = data.clasificacion;
                generosInput.value = data.generos ? data.generos.join(', ') : '';

                formTitle.textContent = `Editar película: ${data.titulo}`;
                showPeliculaForm();
            } catch (error) {
                console.error('Error al obtener los datos de la película:', error);
                alert('Hubo un error al cargar la película para editar.');
            }
        } else if (target.classList.contains('assign-btn')) {
            const peliculaTitulo = target.dataset.titulo;
            // Redirige a la nueva página de turnos, pasando los datos por la URL
            window.location.href = `turnos.html?peliculaId=${peliculaId}&peliculaTitulo=${encodeURIComponent(peliculaTitulo)}`;
        } else if (target.classList.contains('lock-btn')) {
            if (confirm('¿Estás seguro de que quieres cambiar el estado de esta película a Inactivo?')) {
                try {
                    await fetch(`${API_URL}/peliculas/${peliculaId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ estado: 'Inactivo' }),
                    });
                    alert('Estado de la película actualizado a Inactivo.');
                    fetchPeliculas();
                } catch (error) {
                    console.error('Error al actualizar el estado de la película:', error);
                    alert('Hubo un error al cambiar el estado de la película.');
                }
            }
        } else if (target.classList.contains('unlock-btn')) {
            if (confirm('¿Estás seguro de que quieres cambiar el estado de esta película a Activo?')) {
                try {
                    await fetch(`${API_URL}/peliculas/${peliculaId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ estado: 'Activo' }),
                    });
                    alert('Estado de la película actualizado a Activo.');
                    fetchPeliculas();
                } catch (error) {
                    console.error('Error al actualizar el estado de la película:', error);
                    alert('Hubo un error al cambiar el estado de la película.');
                }
            }
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('¿Estás seguro de que quieres eliminar esta película?')) {
                try {
                    const response = await fetch(`${API_URL}/peliculas/${peliculaId}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        alert('Película y turnos asociados marcados como eliminados.');
                        fetchPeliculas();
                    } else {
                        alert('Hubo un error al eliminar la película.');
                    }
                } catch (error) {
                    console.error('Error al eliminar la película:', error);
                    alert('Hubo un error de conexión.');
                }
            }
        }
    });

    // Manejar el envío del formulario de película (crear o actualizar)
    formPelicula.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const peliculaId = idInput.value;
        const method = peliculaId ? 'PUT' : 'POST';
        const url = peliculaId ? `${API_URL}/peliculas/${peliculaId}` : `${API_URL}/peliculas`;

        const peliculaData = {
            titulo: tituloInput.value,
            fechaEstreno: fechaEstrenoInput.value,
            sinopsis: sinopsisInput.value,
            duracionMin: duracionMinInput.value ? parseInt(duracionMinInput.value, 10) : null,
            clasificacion: clasificacionInput.value,
            generos: generosInput.value.split(',').map(g => g.trim()),
        };

        if (method === 'POST') {
            peliculaData.estado = 'Activo';
        }

        try {
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(peliculaData),
            });
            alert(`Película ${peliculaId ? 'actualizada' : 'creada'} correctamente.`);
            hidePeliculaForm();
            fetchPeliculas();
        } catch (error) {
            console.error('Error al guardar la película:', error);
            alert('Hubo un error al guardar la película.');
        }
    });

    fetchPeliculas();
});