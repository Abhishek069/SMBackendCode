const express = require('express');
const route = express.Router();
const User = require('./Module');


route.get('/', async(req,res)=>{
    const userData = await User.find().then((data)=>{
        res.status(200).json({
            success:true,
            message:'All the user are fetched succesfully.',
            data: data
        })
        console.log(data)
    }).catch((err)=>{
        console.log(err)
    })

})

module.exports = route