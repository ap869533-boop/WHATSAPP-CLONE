import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import  cors from 'cors'
import cookieParser from 'cookie-parser'
import connectToDatabase from '../config/dbConnect.js'






connectToDatabase()


const app = express()
app.use(cors())
app.use(express.json())



const PORT = process.env.PORT || 5001;


app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
