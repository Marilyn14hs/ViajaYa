const jwt = require('jsonwebtoken');

// Verificar que el usuario tenga una sesión de administrador válida
function verificarAdmin(req, res, next) {
    const autorizacion = req.headers.authorization;

    if (!autorizacion || !autorizacion.startsWith('Bearer ')) {
        return res.status(401).json({
            mensaje: 'Debes iniciar sesión como administrador'
        });
    }

    const token = autorizacion.split(' ')[1];

    try {
        const datos = jwt.verify(
            token,
            process.env.JWT_SECRETO,
            {
                algorithms: ['HS256']
            }
        );

        if (datos.rol !== 'admin') {
            return res.status(403).json({
                mensaje: 'No tienes permisos de administrador'
            });
        }

        req.admin = datos;

        next();

    } catch (error) {
        return res.status(401).json({
            mensaje: 'Tu sesión no es válida o ha expirado'
        });
    }
}

module.exports = verificarAdmin;