const express = require("express")
const client = require("./client/client")

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))


app.listen(3000,()=>{
    console.log("Server is reunning is 3000");
})