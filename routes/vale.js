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
        creadopor: req.body.userid,
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

//ver todos los vales
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
    }else{
        return res.status(400).json({error : 'No se ha modificado nada'})
    }



});

//borrar vale
app.delete('/vales/:id',[autorizado, esSupervisor], function(req, res) {

    Vale.findOne({idvale : req.params.id}, (error, valeDB)=>{

        if (error) return res.status(400).json({error});
        if (!valeDB) return res.status(400).json({error : 'vale no existe'});
        if (valeDB.activo = false) {
            return res.json({error: 'vale ya ha sido canjeado'})
        }else{
            Vale.deleteOne({idvale : req.params.id}, (err) => {
                if (err) return res.status(400).json({err})
                res.json({ok : 'eliminado correctamente'});
            });
        }
    })

});



// *** Administrador ***

//registrar canje
app.put('/vales/admin/:id', autorizado, function(req, res) {

    if (!req.body.userid || !req.body.local) return res.status(400).json({error : 'enviar userid y localid'});

    let fecha = Date.now() - 5*60*60*1000

    let errorvale = ''
    Vale.findOne({idvale : req.params.id}, (err, valeDB)=>{

        if (err) errorvale = err
        if (!valeDB) errorvale = 'vale no existe'
        if (!valeDB.activo) errorvale = 'vale ya canjeado'
        if (valeDB.vencimiento < fecha) errorvale ='vale ya ha vencido'

        if(errorvale!=''){
            return res.status(400).json({ error : errorvale})
        }else{
            let body = {
                activo: false,
                canjeadopor : req.body.userid,
                localcanje : req.body.localid,
                fechacanje : fecha
            }
            Vale.updateOne({idvale : req.params.id}, body, { new: true, runValidators: true }, (err, valeDB) => {
                if (err) return res.status(400).json({err});
                res.json({ok : 'canjeado correctamente'});
            })
        }
    })

});



// *** Administrador y Cliente***

//ver un vale especifico
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