import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import connectToDatabase from '../config/dbConnect.js'
import bodyParser from 'body-parser'
import authRouter from './routes/authRoute.js'
import chatRouter from './routes/chatRoute.js'
import http from 'http'
import { initializeSocket } from './services/socketService.js'
import statusRouter from './routes/statusRoute.js'








connectToDatabase()


const corsOption = {
  origin: process.env.FRONTEND_URL,
  Credentials: true
}


const app = express()
app.use(cors(corsOption))
app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }))

//create server 

const server = http.createServer(app)

const io = initializeSocket(server)

// apply socket middleware before routes
app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = io.socketUserMap
  next();
})

// routes
app.use('/api/auth', authRouter)
app.use('/api/chat', chatRouter)
app.use('/api/status', statusRouter)



const PORT = process.env.PORT || 5000;


server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
