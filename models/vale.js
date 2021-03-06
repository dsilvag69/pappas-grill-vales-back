const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

let Schema = mongoose.Schema;

const Local  = mongoose.model('Local',new Schema());
const User  = mongoose.model('User',new Schema());

let valeSchema = new Schema({
    idvale: {
        type: String,
        unique: true
    },
    idbeneficiario:{
        type: String,
        // required: [true, 'El beneficiario es necesario']
    },
    monto: {
        type: Number,
        required: [true, 'El monto es necesario']
    },
    pagado:{
        type: Boolean,
        default: true
    },
    vencimiento: {
        type: Date, 
        required: [true, 'El vencimiento es necesario']
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es obligatoria']
    }, 
    locales: [ 
        {type: Schema.Types.ObjectId, ref: Local} 
    ],
    activo: {
        type: Boolean,
        default: true
    },
    creacion: {
        type: Date
    },
    creadopor: {
        type: Schema.Types.ObjectId, ref: User,
        required: [true, 'El id de creador es obligatorio']  
    },
    canjeadopor: {
        type: Schema.Types.ObjectId, ref: User
    },
    localcanje: {
        type: Schema.Types.ObjectId, ref: Local
    },
    fechacanje: {
        type: Date
    }

});

valeSchema.methods.toJSON = function() {

    let vale = this;
    let valeObject = vale.toObject();
    delete valeObject._id;
    delete valeObject.__v;
    delete valeObject.pagado;

    return valeObject;
}


valeSchema.plugin(uniqueValidator, { message: '{PATH} debe de ser único' });


module.exports = mongoose.model('Vale', valeSchema);