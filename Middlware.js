const myMiddlware = (req, res, next) =>{
    console.log("execuaed the middlwae");
    next()
}

module.exports = myMiddlware