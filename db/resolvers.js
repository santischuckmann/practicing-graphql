const Usuario = require('../models/Usuario')
const Producto = require('../models/Producto')
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require("dotenv").config({ path: "variables.env" });

/* La misma palabra secreta debe ser la que verifica
y la que crea el token*/

const crearToken = (usuario, secreta, expiresIn) => {
  const { id, email, nombre , apellido } = usuario;

  return jwt.sign ( { id, email, nombre, apellido }, secreta, { expiresIn})
}

// Resolvers
const resolvers = {
  Query: {
      obtenerUsuario: async (_, { token } ) => {
        const usuarioId = await jwt.verify(token, process.env.SECRETA);

        return usuarioId;
      },
      obtenerProductos: async () => {
        try {
        const productos = await Producto.find({});

        return productos;
        } catch(error) {
          console.log(error);
        }
      },
      obtenerProducto: async (_, { id} ) => {
          const producto = await Producto.findById(id)

          if (!producto) {
            throw new Error('Producto no encontrado');
          }

          return producto;
      }
  },
  Mutation: {
    nuevoUsuario: async (_, { input }) => {
      const { email, password } = input;
      
      const existeUsuario = await Usuario.findOne({email});
      if (existeUsuario) {
        throw new Error('El usuario ya esta registrado');
      }

      const salt = await bcryptjs.genSalt(10);
      input.password = await bcryptjs.hash(password, salt)
      //Hashear password


      try {
        const usuario = new Usuario(input);
        usuario.save();
        return usuario;
      } catch(error) {
        console.log(error);
      }
    },
    autenticarUsuario: async (_, {input}) => {
      const { email, password } = input
      const existeUsuario = await Usuario.findOne({email})
      
      if (!existeUsuario) {
        throw new Error('El usuario no existe')
      }

      //revisar si existe el password
      const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);

      if(!passwordCorrecto) {
        throw new Error('El password es incorrecto')
      }

      //crear el token

      return {
        token: crearToken(existeUsuario, process.env.SECRETA, '24h')
      }
    }, 
    nuevoProducto: async (_, { input }) => {
      try {
        const producto = new Producto(input)

        const resultado = await producto.save();

        return resultado;
      } catch(error) {
        console.log(error)
      }
    },
    actualizarProducto: async (_, { id, input }) => {
      let producto = await Producto.findById(id)

      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      // guardarlo en la base de datos

      producto = await Producto.findOneAndUpdate({_id: id}, input, {new: true});

      return producto;
    },
    eliminarProducto: async (_, { id }) => {
      let producto = await Producto.findById(id)

      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      await Producto.findOneAndDelete({_id: id});

      return "Producto eliminado";
    }
  }
}

module.exports = resolvers;