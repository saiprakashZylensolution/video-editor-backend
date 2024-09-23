const express = require('express');
const cors = require('cors')
const routes = require('./routes/router')
const PORT = 3001

const app = express()
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb',extended: true}));
app.use(cors())

app.use('/api',routes)
app.listen(PORT,()=>{
        console.log('http://localhost:3001')
})
