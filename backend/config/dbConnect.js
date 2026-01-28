import mongoose from "mongoose";


const connecttoDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("database is connect")
    } catch (error) {
        console.log(error);
    }
}

export default connecttoDatabase;