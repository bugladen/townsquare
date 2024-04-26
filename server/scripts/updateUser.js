/*eslint no-console:0 */
const monk = require('monk');
const bcrypt = require('bcrypt');
const UserService = require('../services/UserService.js');

if(process.argv.length < 4) {
    console.log('Missing some parameters!');
    return;
}

const actionType = process.argv[2];
const userName = process.argv[3];
const db = monk('mongodb://127.0.0.1:27017/townsquare');
const userService = new UserService(db);

async function newUser() {
    let passwordHash = await hashPassword('4thelulZ{?)', 10);
    let newUser = {
        password: passwordHash,
        registered: new Date(),
        username: userName,
        email: 'dummy@email.com',
        enableGravatar: '',
        verified: true,
        registerIp: '127.0.0.1'
    };
    await userService.addUser(newUser);
    db.close();
}

async function getUser() {
    let user = await userService.getUserByUsername(userName);
    user.userData.permissions = {
        isAdmin:'true',
        canEditNews:'true',
        canManageUsers:'true',
        canManagePermissions:'true',
        canManageGames:true,
        canManageMotd:true,
        canManageNodes:true,
        canManageBanlist:true,
        canModerateChat:true,
        canManageEvents:true,
        isSupporter:true,
        isContributor:true
    };
    return user.userData;
}

async function updateUserToAdmin() {
    let user = await getUser();
    await userService.update(user);
    db.close();
}
function hashPassword(password, rounds) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, rounds, function(err, hash) {
            if(err) {
                return reject(err);
            }
            return resolve(hash);
        });
    });
}

if(actionType === '-u') {
    updateUserToAdmin();
}
if(actionType === '-a') {
    newUser();
}
