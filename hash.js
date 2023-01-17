var bcrypt = require('bcrypt');

const hash = async(pas)=>{
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(pas,salt);

    return password
}

module.exports = hash;