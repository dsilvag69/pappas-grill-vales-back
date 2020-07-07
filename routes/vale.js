const express = require('express');
const Vale = require('../models/vale');
const app = express();
const _ = require('underscore');
const {autorizado, esSupervisor} = require('../middlewares/autenticacion')


// *** Supervisor ***

//crear vale
app.post('/vales', [autorizado, esSupervisor], function(req, res) {

    try {
        var locales = JSON.parse(req.body.locales)       
    } catch (error) {
        return res.status(400).json({error : "locales debe ser un array de id's"})
    }

    let creacion =  Date.now() - 5*60*60*1000
    let idvale = creacion.toString(36)

    let vale = new Vale({
        monto: req.body.monto,
        vencimiento: req.body.vencimiento,
        descripcion: req.body.descripcion,
        creadopor: req.usuario._id,
        locales,
        creacion,
        idvale
    });

    vale.save((error,valeDB) => {
        if (error) return res.status(400).json({error})
        res.json({
            ok : 'creado correctamente',
            vale: valeDB    
        });
    });
});

//obtener vales
app.get('/vales', [autorizado, esSupervisor], function(req, res) {

    let inicio = req.query.inicio || 0;
    inicio = Number(inicio);

    let rango = req.query.rango || 10;
    rango = Number(rango);

    Vale.find()
        .skip(inicio)
        .limit(rango)
        .populate('locales', 'name')
        .populate('creadopor', 'name')
        .populate('canjeadopor','name')
        .populate('canjeadopor','name')
        .populate('localcanje','name')
        .exec((error, vales) => {
            if (error) return res.status(400).json({error})
            Vale.count({}, (err, cantidad) => {
                res.json({vales, cantidad});
            })
        });
});

//obtener datos de vales para dashboard
app.get('/vales/dash', [autorizado, esSupervisor],function(req, res) {

    let fechainicial = req.query.fechainicial || 0;
    let fechafinal = req.query.fechafinal || Date.now() - 5*60*60*1000;
    let local = req.query.local || '';
    let filtro = req.query.canjeados || false 


    if (local){
        if (filtro){
            Vale.find({ localcanje : local , fechacanje: { $gte: fechainicial, $lte: fechafinal }})
            .exec((error, vales) => {
                if (error) return res.status(400).json({error})
                let cantidad = Object.keys(vales).length
                var suma = 0
                vales.forEach((vale)=>{
                    suma = suma + vale.monto
                });
                let resumen = {
                    cantidad,
                    suma : suma.toFixed(2)
                }
                res.json({resumen});
            });
        }else{
        Vale.find({ localcanje : local , creacion: { $gte: fechainicial, $lte: fechafinal }})
            .exec((error, vales) => {
                if (error) return res.status(400).json({error})
                let cantidad = Object.keys(vales).length
                var suma = 0
                var canjeados = 0
                var sumacanjeados = 0
                vales.forEach((vale)=>{
                    suma = suma + vale.monto
                    if(vale.canjeadopor){
                        canjeados = canjeados + 1
                        sumacanjeados = sumacanjeados + vale.monto
                    }
                });
                let resumen = {
                    cantidad,
                    suma : suma.toFixed(2),
                    canjeados,
                    sumacanjeados : sumacanjeados.toFixed(2)
                }
                res.json({resumen});
            });
        }
    }else{
        if (filtro){
            Vale.find({fechacanje: { $gte: fechainicial, $lte: fechafinal }})
            .exec((error, vales) => {
                if (error) return res.status(400).json({error})
                let cantidad = Object.keys(vales).length
                var suma = 0
                vales.forEach((vale)=>{
                    suma = suma + vale.monto
                });
                let resumen = {
                    cantidad,
                    suma : suma.toFixed(2)
                }
                res.json({resumen});
            });
        }else{
        Vale.find({creacion: { $gte: fechainicial, $lte: fechafinal }})
            .exec((error, vales) => {
                if (error) return res.status(400).json({error})
                                    let cantidad = Object.keys(vales).length
                var suma = 0
                var canjeados = 0
                var sumacanjeados = 0
                vales.forEach((vale)=>{
                    suma = suma + vale.monto
                    if(vale.canjeadopor){
                        canjeados = canjeados + 1
                        sumacanjeados = sumacanjeados + vale.monto
                    }
                });
                let resumen = {
                    cantidad,
                    suma : suma.toFixed(2),
                    canjeados,
                    sumacanjeados : sumacanjeados.toFixed(2)
                }
                res.json({resumen});
            });
        }
    }
    
});



//modificar vale
app.put('/vales/:id', [autorizado, esSupervisor], function(req, res) {

    Vale.findOne({idvale : req.params.id}, (error, valeDB)=>{
        if (error) return res.status(400).json({error});
        if (valeDB.activo = false) return res.json({error: 'vale ya ha sido canjeado'})
    })

    let body = _.pick(req.body, ['idbeneficiario','monto','vencimiento','descripcion','locales']);
    let size = Object.keys(body).length
    if( size > 0) {
        Vale.updateOne({idvale : req.params.id}, body, { new: true, runValidators: true }, (err) => {
            if (err) return res.status(400).json({error : err});
            res.json({ok : 'modificado correctamente'});
        })
    }else return res.status(400).json({error : 'No se ha modificado nada'})
});

//borrar vale
app.delete('/vales/:id',[autorizado, esSupervisor], function(req, res) {

    Vale.findOne({idvale : req.params.id}, (error, valeDB)=>{

        if (error) return res.status(400).json({error});
        if (!valeDB) return res.status(400).json({error : 'vale no existe'});
        if (valeDB.activo = false) {
            Vale.deleteOne({idvale : req.params.id}, (err) => {
                if (err) return res.status(400).json({err})
                res.json({ok : 'eliminado correctamente'});
            });
        }else{
            return res.json({error: 'vale ya ha sido canjeado'})
        }
    })
});



// *** Administrador ***

//registrar canje
app.put('/vales/admin/:id', autorizado, function(req, res) {

    let fecha = Date.now() - 5*60*60*1000

    let errorvale = ''

    Vale.findOne({idvale : req.params.id}, (err, valeDB)=>{

        if (err) errorvale = err
        if (!valeDB) errorvale = 'vale no existe'
        if (!valeDB.activo) errorvale = 'vale ya canjeado'
        if (valeDB.vencimiento < fecha) errorvale ='vale ya ha vencido'

        let body = {
            activo: false,
            canjeadopor : req.usuario._id,
            localcanje : req.usuario.locals[0]._id,
            fechacanje : fecha
        }

        if(errorvale!=''){
            return res.status(400).json({ error : errorvale})
        }else{
            Vale.updateOne({idvale : req.params.id}, body, { new: true, runValidators: true }, (err) => {
                if (err) return res.status(400).json({err});
                res.json({ok : 'canjeado correctamente'});
            })
        }
    })

});



// *** Administrador y Cliente***

//obtener vale por ID
app.get('/vales/:id', function(req, res) {

    Vale.findOne({ idvale : req.params.id})
        .populate('locales', 'name')
        .populate('creadopor','name')
        .populate('canjeadopor','name')
        .populate('localcanje','name')
        .exec((error, valeDB) => {
            if (error) return res.status(400).json({error})
            if(!valeDB) {
                return res.status(400).json({error : 'vale no existe'})
            }else{
                res.json({valeDB});
            }
        });

});


module.exports = app;