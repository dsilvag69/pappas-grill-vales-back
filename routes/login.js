const express = require('express');
const app = express();
const _ = require('underscore');
const bcrypt = require('bcrypt');
const axios = require('axios');

app.post('/login',async function(req, res) {
    
    let body = {email: req.body.usuario, password: req.body.contraseña}
    try {
        let usuario = await axios.post('https://sigpappas.herokuapp.com/login', body)
        if (!usuario.data.err) return res.json({user : usuario.data})
    } catch (error) {
        console.log(error);
        res.status(401).json({error : "usuario y/o contraseña incorrectas"})
    }

});

module.exports = app;