const express = require('express');
const Vale = require('../models/vale');
const app = express();
const _ = require('underscore');

//crear vales
app.post('/vales', function(req, res) {

    let locales = JSON.parse(req.body.locales)
    let vale = new Vale({
        id: req.body.id,
        monto: req.body.monto,
        vencimiento: req.body.vencimiento,
        descripcion: req.body.descripcion,
        locales,
        creadopor: req.body.userid 
    });

    vale.save((err, valeDB) => {

        if (err) {
            console.log(err);
            return res.status(400).json({err});}

        res.json({vale: valeDB});

    });

});

//ver todos los vales
app.get('/vales', function(req, res) {

    Vale.find()
        .populate('local', 'name')
        .populate('creadopor', 'name')
        .populate('canjeadopor','name')
        .populate('canjeadopor','name')
        .populate('localcanje','name')
        .exec((err, vales) => {

            if (err) {
                console.log(err);
                return res.status(400).json({err});}

            res.json({vales});

        });

});

//ver un vale especifico
app.get('/vales/:id', function(req, res) {

    Vale.find({ _id : req.params.id})
        .populate('locales', 'name')
        .populate('creadopor','name')
        .populate('canjeadopor','name')
        .populate('localcanje','name')
        .exec((err, vales) => {

            if (err) {
                console.log(err);
                return res.status(400).json({err});}

            res.json({vales});

        });

});

//registrar canje
app.put('/vales/:id', function(req, res) {

    let fecha = Date.now() - 5*60*60*1000

    if (!req.body.userid || !req.body.local) return res.status(400).json({error : 'enviar userid y localid'});

    let body = {
        activo: false,
        canjeadopor : req.body.userid,
        localcanje : req.body.localid,
        fechacanje : fecha
    }
    Vale.updateOne({_id : req.params.id}, body, { new: true, runValidators: true }, (err, valeDB) => {

        if (err) return res.status(400).json({err});

        res.json({vale: valeDB});

    })

});

//ver vales canjeados por administrador
app.get('/vales/admin/:id', function(req, res) {

    Vale.find({ canjeadopor : req.params.id})
        .select(['-creadopor','-locales','-creacion','-canjeadopor'])
        .populate('localcanje', 'name')
        .exec((err, vales) => {

            if (err) {
                console.log(err);
                return res.status(400).json({err});}

            res.json({vales});

        });

});

//borrar vale con id
app.delete('/vales/:id', function(req, res) {

    Vale.deleteOne({_id : req.params.id}, (err, valeDB) => {

        if (err) return res.status(400).json({err})

        res.json({valeDB});

    });

});



module.exports = app;