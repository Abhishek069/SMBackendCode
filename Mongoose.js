const mongoose = require('mongoose');

const DataBaseConnect = async() => {
    try{
       await mongoose.connect('mongodb://localhost:27017/SattaMatka', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log("Connection Done For DB")
    }
    catch(error){
        console.log("Some thing went wrong for the connection", error)
    }
}

module.exports = DataBaseConnect


