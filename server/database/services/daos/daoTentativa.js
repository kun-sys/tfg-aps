const transferOfertaServicio = require('../transfers/transferOfertaServicio');
const transferAnuncioServicio = require('../transfers/transferAnuncioServicio');
const transferDemandaServicio = require('../transfers/transferDemandaServicio');
const transferMensaje = require('../transfers/transferMensajes');
const transferUpload = require('../transfers/transferUpload');
const daoComunicacion = require('./daoComunicacion');
const daoUsuario = require('./daoUsuario');
const mysql = require('mysql');
const knex = require('../../config');

// Inserta en la base de datos un nuevo anuncio de servicio
// areasServicio es un array de ids de areas de servicio
function crearAnuncio(titulo, descripcion, imagen, _v, areasServicio) {
    return knex('anuncio_servicio').insert({
        titulo: titulo, descripcion: descripcion, imagen: imagen, _v: _v
    }).then((id_anuncio) => {
        const fieldsToInsert = areasServicio.map(area => ({ id_area: area, id_anuncio: id_anuncio }));
        return knex('areaservicio_anuncioservicio').insert(fieldsToInsert).then(() => {
            return id_anuncio;
        });
    })
        .catch((err) => {
            console.log(err);
            console.log("Se ha producido un error al intentar crear el anuncio con titulo ", titulo);
        });
}

// Inserta en la base de datos una nueva oferta de servicio
//oferta.getAsignatura_objetivo() un array con los nombres de las asignaturas
function crearOferta(oferta) {
    return crearAnuncio(oferta.getTitulo(), oferta.getDescripcion(), oferta.getImagen(), oferta.get_v(), oferta.getArea_servicio()).then(function (id_anuncio) {
        return knex('oferta_servicio').insert({
            id: id_anuncio[0], cuatrimestre: oferta.getCuatrimestre(), anio_academico: oferta.getAnio_academico(),
            fecha_limite: oferta.getFecha_limite(), observaciones_temporales: oferta.getObservaciones_temporales(),
            creador: oferta.getCreador()
        })
            .then(function (result) {
                asignaturas = oferta.getAsignatura_objetivo();
                const fieldsToInsert = asignaturas.map(asignatura => ({ id_oferta: id_anuncio[0], nombre: asignatura }));
                return knex('asignatura_objetivo').insert(fieldsToInsert).then(() => {
                    // TO DO: obtener el id de todos los profesores que participan en la oferta e insertarlo en la tabla "profesorinterno_oferta"
                    console.log("Se ha introducido la oferta con id ", id_anuncio[0]);     // respond back to request
                });
            });
    });
}

// Inserta en la base de datos una nueva oferta de servicio
function crearDemanda(demanda) {
    return crearAnuncio(demanda.getTitulo(), demanda.getDescripcion(), demanda.getImagen(), oferta.get_v(), demanda.getArea_servicio()).then(function (id_anuncio) {
        return knex('demanda_servicio').insert({
            id: id_anuncio[0], creador: demanda.getCreador(), ciudad: demanda.getCiudad(),
            finalidad: demanda.getFinalidad(), periodo_definicion_ini: demanda.getPeriodo_definicion_ini(), periodo_definicion_fin: demanda.getPeriodo_definicion_fin(),
            periodo_ejecucion_ini: demanda.getPeriodo_ejecucion_ini(), periodo_ejecucion_fin: demanda.getPeriodo_ejecucion_fin(),
            fecha_fin: demanda.getFecha_fin(), observaciones_temporales: demanda.getObservaciones_temporales(), necesidad_social: demanda.getNecesidad_social()
        })
            .then(function () {
                const titulaciones = demanda.getTitulacionlocal_demandada();
                const fieldsToInsert = titulaciones.map(titulacion =>
                    ({ id_titulacion: titulacion, id_demanda: id_anuncio[0] }));
                return knex('titulacionlocal_demanda').insert(fieldsToInsert).then(() => {
                    console.log("Se ha introducido la demanda con id ", id_anuncio[0]);     // respond back to request
                });
            });
    });
}

// Devuelve el anuncio de servicio que corresponda al id = id_anuncio
function obtenerAnuncioServicio(id_anuncio) {
    return knex('anuncio_servicio').where({ id: id_anuncio }).select('*').then((anuncio) => {
        return obtenerAreaServicio(id_anuncio).then((areas_servicio) => {
            return obtenerMensajesPorAnuncio(id_anuncio).then((mensajes) => {
                return obtenerUploadsPorAnuncio(id_anuncio).then((uploads) => {
                    areas = [];
                    for (area of areas_servicio) {
                        areas.push(area['nombre']);
                    }
                    return new transferAnuncioServicio(
                        id_anuncio,
                        anuncio[0]['titulo'],
                        anuncio[0]['descripcion'],
                        anuncio[0]['imagen'],
                        anuncio[0]['created_at'],
                        anuncio[0]['updated_at'],
                        anuncio[0]['_v'],
                        areas,
                        // TO DO: terminar de implementar cuando este listo el DAO de comunicación
                        mensajes,
                        uploads
                    );
                });
            });
        });
    });
}

// Devuelve la demanda que tenga el id = "id_demanda"
function obtenerDemandaServicio(id_demanda) {
    return obtenerAnuncioServicio(id_demanda).then(function (anuncio) {
        return knex('demanda_servicio').where({ id: id_demanda }).select('*').then(function (demanda) {
            return knex('necesidad_social').where({ id: demanda[0]['necesidad_social'] }).select('nombre').then(function (necesidad_social) {
                return obtenerTitulacionLocal(id_demanda).then(function (titulaciones) {
                    titulaciones_ref = [];
                    for (titulacion of titulaciones) {
                        titulaciones_ref.push(titulacion['nombre']);
                    }
                    return new transferDemandaServicio(
                        demanda[0]['id'],
                        anuncio.getTitulo(),
                        anuncio.getDescripcion(),
                        anuncio.getImagen(),
                        anuncio.getCreated_at(),
                        anuncio.getUpdated_at(),
                        anuncio.get_v(),
                        demanda[0]['creador'],
                        demanda[0]['ciudad'],
                        demanda[0]['finalidad'],
                        demanda[0]['periodo_definicion_ini'],
                        demanda[0]['periodo_definicion_fin'],
                        demanda[0]['periodo_ejecucion_ini'],
                        demanda[0]['periodo_ejecucion_fin'],
                        demanda[0]['fecha_fin'],
                        demanda[0]['observaciones_temporales'],
                        necesidad_social,
                        titulaciones_ref,
                        anuncio.getArea_servicio(),
                        anuncio.getMensajes(),
                        anuncio.getUploads()
                    );
                });
            });
        });
    });

}

// Devuelve la oferta que tenga el id = "id_oferta"
function obtenerOfertaServicio(id_oferta) {
    return obtenerAnuncioServicio(id_oferta).then(function (anuncio) {
        return knex('oferta_servicio').where({ id: id_oferta }).select('*').then(function (oferta) {
            return obtenerProfesoresPorOferta(id_oferta).then(function (profesores) {
                return obtenerAsignaturaObjetivo(id_oferta).then((asignaturas) => {
                    asignaturas_ref = [];
                    for (asignatura of asignaturas) {
                        asignaturas_ref.push(asignatura['nombre']);
                    }
                    return new transferOfertaServicio(
                        oferta[0]['id'],
                        anuncio.getTitulo(),
                        anuncio.getDescripcion(),
                        anuncio.getImagen(),
                        anuncio.getCreated_at(),
                        anuncio.getUpdated_at(),
                        anuncio.get_v(),
                        asignaturas_ref,
                        oferta[0]['cuatrimestre'],
                        oferta[0]['anio_academico'],
                        oferta[0]['fecha_limite'],
                        oferta[0]['observaciones_temporales'],
                        oferta[0]['creador'],
                        anuncio.getArea_servicio(),
                        anuncio.getMensajes(),
                        anuncio.getUploads(),
                        // TO DO: terminar de implementar cuando esten listo el DAO de usuario
                        profesores
                    );
                });
            });
        });
    })
        .catch((err) => {
            console.log(err);
            console.log("Se ha producido un error al intentar obtener de la base de datos la oferta de servicio con id ", id_oferta);
        })
        .finally(() => {
            knex.destroy();
        });
}

function actualizarAnuncio(id, titulo, descripcion, imagen, _v, areasServicio) {
    return knex('anuncio_servicio').where('id', id).update({
        titulo: titulo, descripcion: descripcion, imagen: imagen, _v: _v
    }).then((id_anuncio) => {
        // const fieldsToInsert = areasServicio.map(area => ({ id_area: area, id_anuncio: id_anuncio }));
        // return knex('areaservicio_anuncioservicio').insert(fieldsToInsert).then(() => {
        //     return id_anuncio;
        // });
    })
        .catch((err) => {
            console.log(err);
            console.log("Se ha producido un error al intentar crear el anuncio con titulo ", titulo);
        });
}

function actualizarOfertaServicio(oferta){
    return actualizarAnuncio(oferta.getId(), oferta.getTitulo(), oferta.getDescripcion(), oferta.getImagen(), oferta.get_v(), oferta.getArea_servicio()).then(function (id_anuncio) {
        return knex('oferta_servicio').where('id', id_anuncio).update({
            cuatrimestre: oferta.getCuatrimestre(), anio_academico: oferta.getAnio_academico(),
            fecha_limite: oferta.getFecha_limite(), observaciones_temporales: oferta.getObservaciones_temporales(),
            creador: oferta.getCreador()
        })
            .then(function (result) {
                // asignaturas = oferta.getAsignatura_objetivo();
                // const fieldsToUpdate = asignaturas.map(asignatura => ({ id_oferta: id_anuncio[0], nombre: asignatura }));
                // return knex('asignatura_objetivo').where('id_oferta', id_anuncio).update(fieldsToUpdate).then(() => {
                //     // TO DO: obtener el id de todos los profesores que participan en la oferta e insertarlo en la tabla "profesorinterno_oferta"
                //     console.log("Se ha introducido la oferta con id ", id_anuncio[0]);     // respond back to request
                // });
            });
    });
}

function obtenerAsignaturaObjetivo(id_oferta) {
    return knex('asignatura_objetivo').where({ id_oferta: id_oferta }).select('nombre')
        .catch((err) => { console.log("No se ha encontrado titulación perteneciente al anuncio de servicio con id ", id_demanda); throw err });
}

function obtenerTitulacionLocal(id_demanda) {
    return knex('titulacionlocal_demanda').where({ id_demanda: id_demanda }).select('id_titulacion')
        .then(function (id_titulaciones) {
            titulaciones = [];
            for (id_titulacion of id_titulaciones) {
                titulaciones.push(id_titulacion['id_titulacion']);
            }
            return knex.select('nombre').from('titulacion_local').whereIn('id', titulaciones);

        })
        .catch((err) => { console.log("No se ha encontrado titulación perteneciente al anuncio de servicio con id ", id_demanda); throw err });
}

// Obtiene el area de servicio correspondiente al id de un anuncio de servicio
function obtenerAreaServicio(id_anuncio) {
    return knex('areaservicio_anuncioservicio').where({ id_anuncio: id_anuncio }).select('id_area')
        .then(function (id_areas) {
            areas = [];
            for (id_area of id_areas) {
                areas.push(id_area['id_area']);
            }
            return knex.select('nombre').from('area_servicio').whereIn('id', areas);

        })
        .catch((err) => { console.log("No se ha encontrado el area de servicio perteneciente al anuncio de servicio con id ", id_anuncio); throw err });
}

// Devuelve todos los mensajes pertenecientes al anuncio de servicio con id=id_anuncio
function obtenerMensajesPorAnuncio(id_anuncio) {
    return knex('mensaje_anuncioservicio').where({ id_anuncio: id_anuncio }).select('id_mensaje')
        .then(function (id_mensajes) {
            return daoComunicacion.obtenerMensajes(id_mensajes); //Esto devuelve un array de transferMensaje
        });
}

// Devuelve todos los mensajes pertenecientes al anuncio de servicio con id=id_anuncio
function obtenerUploadsPorAnuncio(id_anuncio) {
    return knex('upload_anuncioservicio').where({ id_anuncio: id_anuncio }).select('id_upload')
        .then(function (id_uploads) {
            return daoComunicacion.obtenerUploads(id_uploads); //Esto devuelve un array de transferUpload
        });
}

// Devuelve todos los profesores pertenecientes al anuncio de servicio con id=id_anuncio
function obtenerProfesoresPorOferta(id_oferta) {
    return knex('profesorinterno_oferta').where({ id_oferta: id_oferta }).select('id_profesor')
        .then(function (id_profesores) {
            return daoUsuario.obtenerProfesoresInternos(id_profesores); //Esto devuelve un array de transferUpload
        });
}

//Elimina todos los elementos de la tabla anuncio_servicio
function limpiarAnuncioServicios() {
    knex('anuncio_servicio').del()
        .then(function (result) {
            console.log("Se han eliminado ", result, " elementos de la tabla anuncio_servicio ");     // respond back to request
        })
}

module.exports = { obtenerAreaServicio, obtenerAnuncioServicio, crearOferta, crearAnuncio, limpiarAnuncioServicios, obtenerOfertaServicio, obtenerDemandaServicio, obtenerMensajesPorAnuncio, crearDemanda };