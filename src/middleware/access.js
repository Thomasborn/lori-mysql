const jwt = require('jsonwebtoken');
const secretKey       = process.env.Key;
const prisma = require("../db");
const hak_akses = require("../hak_akses/hak_akses.service")
const NodeCache = require('node-cache');
const permissionsCache = new NodeCache();

  // const role_permission = async (userData) => {
  //   try {
  //     const permissions = await prisma.hak_akses.findMany({
  //       where: {
  //         role_id: userData, // Assuming `userData` contains the user's role_id
  //       },
  //     });
  //     return permissions;
  //   } catch (error) {
  //     // Handle any potential errors, e.g., database query errors
  //     console.error('Error fetching user permissions:', error);
  //     return [];
  //   }
  // };
  const adminMiddleware = (req, res, next) => {
    // Check if the user has admin permissions
    // const url = req.url;
    // const permissions =  req.userPermissions;
    // console.log(permissions);
    
    //   res.status(401).json({ message: `Akses tidak dimiliki untuk ${url}`,permissions: permissions });
    
    
  };
  
  // Define other role-specific middleware functions as needed
  const ownerMiddleware = (req, res, next) => {
   
    
  

    // Implement logic for the owner role
  };
  
  const qcMiddleware = (req, res, next) => {
    // Implement logic for the QC role
  };
  
  const penjahitMiddleware = (req, res, next) => {
    // Implement logic for the penjahit role
  };
  const getPermissions = async (roleId) => {
    const cachedPermissions = permissionsCache.get(roleId);
  
    if (cachedPermissions) {
      console.log('Permissions found in cache');
      return cachedPermissions;
    } else {
      console.log('Fetching permissions from the database');
      // Replace the following line with your actual logic to fetch permissions from the database
      const permissions = await hak_akses.getHakAksesByRoleId(roleId);
      permissionsCache.set(roleId, permissions, /* set your expiration time in seconds */);
      return permissions;
    }
  };
  const methodMappings = {
    'read': 'GET',
    'create': 'POST',
    'update': 'PUT',
    // Add more mappings as needed
  };
  
  const mapAksesNamaToMethod = (aksesNama) => {
    return methodMappings.hasOwnProperty(aksesNama) ? methodMappings[aksesNama] : aksesNama;
  };
  
  const checkPermission = (url, method, fungsiNama, aksesNama) => {
    const mappedAksesNama = mapAksesNamaToMethod(aksesNama);
    return (url.includes(fungsiNama) && mappedAksesNama === method) || (url.includes(fungsiNama) && mappedAksesNama === 'crud');
  };
  async function checkAuth(req, res, next) {
    try {
      if (req.session && req.session.user && req.session.user.role_id) {
        const role = await prisma.role.findUnique({
          where: { id: req.session.user.role_id },
          include: { abilityRules: true },
        });
  
        const requestedRoute = req.originalUrl.split('?')[0].split('/').slice(1, 3).join('-');
        const method = req.method.toLowerCase();
  
        const urlParts = req.originalUrl.split('?')[0].split('/');
        const userId = urlParts[3];
  
        const methodToActionMap = {
          get: 'read',
          post: 'create',
          put: 'update',
          patch: 'update',
          delete: 'delete',
        };
  
        const action = methodToActionMap[method];
  
        // Check for inverted rules first
        const isInvertedDenied = role.abilityRules.some(rule => 
          rule.inverted && rule.action === action && rule.subject === requestedRoute
        );
  
        // If inverted rule denies access, deny it regardless of other permissions
        if (isInvertedDenied) {
          return res.status(403).json({ success: false, message: `Akses tidak dimiliki untuk ${requestedRoute}` });
        }
  
        // Check for general and specific permissions
        const hasPermission = role.abilityRules.some(rule => {
          if (rule.action === 'manage' && rule.subject === 'all') {
            return true; // Full access granted
          }
  
          if (rule.action === action) {
            if (rule.subject === 'halaman-profil-pengguna' && userId && req.session.user.id === parseInt(userId)) {
              return true; // Allow access if the user is accessing their own profile
            }
  
            return rule.subject === requestedRoute || rule.subject === 'all';
          }
  
          return false;
        });
  
        if (hasPermission) {
          return next();
        } else {
          return res.status(403).json({ success: false, message: `Akses tidak dimiliki untuk ${requestedRoute}` });
        }
      } else {
        return res.status(401).json({ success: false, message: 'Sesi tidak sah' });
      }
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return res.status(500).json({ success: false, message: 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi' });
    }
  
  
  function mapMethodToAction(method) {
    const methodToActionMap = {
      get: 'read',
      post: 'create',
      put: 'update',
      patch: 'update',
      delete: 'delete',
    };
    return methodToActionMap[method];
  }
  
  
  // // next();
  //   try{
  //     const userData = parseInt(req.session.user.karyawan.role_id);
      
  //     // return res.status(401).json({ message: 'Akses tidak dimiliki' ,user:userData});
  //     // if(!userData){
  
  //     //   return res.status(401).json({ message: 'Akses tidak dimiliki' ,user:userData});
  //     // }
   
  //   // change into role
  // 

    
   

  
  
};

module.exports = checkAuth;
