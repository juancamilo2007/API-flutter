require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');  
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors()); // Habilita CORS para permitir conexiones externas

const secretKey = 'supersecreta123';  // Puedes cambiarla por una más segura

// Función para generar token
const generarToken = (usuario) => {
  return jwt.sign({ id: usuario._id, rol: usuario.rol }, secretKey, { expiresIn: '1h' });
};

// Middleware para proteger rutas
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ mensaje: "Acceso denegado" });

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.status(403).json({ mensaje: "Token inválido" });
    req.usuario = decoded;
    next();
  });
};

// 📌 Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/fullstack_game', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error de conexión:", err));

// 📌 Definir el esquema y modelo de usuario
const UsuarioSchema = new mongoose.Schema({
  nombre: String,
  correo: String,
  password: String,
  rol: String
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);

// 📌 Definir el esquema y modelo de producto
const ProductoSchema = new mongoose.Schema({
  nombre: String,
  precio: Number,
  descripcion: String
});

const Producto = mongoose.model('Producto', ProductoSchema);

// Rutas para productos
app.post('/productos', async (req, res) => {
  try {
    const { nombre, precio, descripcion } = req.body;
    if (!nombre || !precio || !descripcion) {
      return res.status(400).json({ mensaje: "Faltan datos del producto" });
    }
    const nuevoProducto = new Producto({ nombre, precio, descripcion });
    await nuevoProducto.save();
    res.status(201).json({ mensaje: "Producto agregado exitosamente", producto: nuevoProducto });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al agregar el producto", error });
  }
});

app.put('/productos/:id', async (req, res) => {
  try {
    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      { nombre: req.body.nombre, precio: req.body.precio, descripcion: req.body.descripcion },
      { new: true }
    );
    if (!productoActualizado) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }
    res.json({ mensaje: "Producto actualizado", producto: productoActualizado });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar el producto", error });
  }
});

app.get('/productos', async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los productos" });
  }
});

app.delete('/productos/:id', async (req, res) => {
  try {
    const productoEliminado = await Producto.findByIdAndDelete(req.params.id);
    if (!productoEliminado) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }
    res.json({ mensaje: "Producto eliminado", producto: productoEliminado });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar el producto", error });
  }
});

// 📌 Rutas para usuarios
app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los usuarios" });
  }
});

app.post('/usuarios', async (req, res) => {
  try {
    const { nombre, correo, password, rol } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({ mensaje: "Faltan datos para crear el usuario" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Si el rol no está definido o es inválido, se asigna "Usuario" por defecto
    const nuevoRol = rol && (rol === "admin" || rol === "Usuario") ? rol : "Usuario";

    const nuevoUsuario = new Usuario({ nombre, correo, password: hashedPassword, rol: nuevoRol });
    await nuevoUsuario.save();

    res.status(201).json({ mensaje: "Usuario creado exitosamente", usuario: nuevoUsuario });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear el usuario", error });
  }
});



app.post('/login', async (req, res) => {
    const { correo, password } = req.body;

    try {
        const usuario = await Usuario.findOne({ correo });

        if (!usuario) {
            return res.status(401).json({ mensaje: "Usuario no encontrado" });
        }

        // Comparar la contraseña ingresada con la almacenada (hash)
        const passwordValida = await bcrypt.compare(password, usuario.password);

        if (!passwordValida) {
            return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        }

        res.json({ mensaje: "Inicio de sesión exitoso", usuario });
    } catch (error) {
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
});


app.put("/usuarios/:id", async (req, res) => {
  try {
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      { nombre: req.body.nombre, correo: req.body.correo },
      { new: true }
    );
    if (!usuarioActualizado) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    res.json({ mensaje: "Usuario actualizado", usuario: usuarioActualizado });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar el usuario", error });
  }
});

app.delete('/usuarios/:id', async (req, res) => {
  try {
    const usuarioEliminado = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuarioEliminado) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    res.json({ mensaje: "Usuario eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar el usuario", error });
  }
});

// 📌 Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));