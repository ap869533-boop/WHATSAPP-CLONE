import React, { use } from 'react'
import Layout from './Layout'
import { motion } from 'framer-motion'
import ChatList from '../pages/chatSection/ChatList'
import ChatWindow from '../pages/chatSection/ChatWindow'
import Sidebar from './Sidebar'
import UserDetails from './UserDetails'
import userLayoutStore from '../store/layoutStore'
import { useState } from 'react'
import { getAllUsers } from '../services/user.service'

const HomePage = () => {
    const setSelectedContect = userLayoutStore((state)=>state.setSelectedContect);
    const [allUsers,setAllUsers] = useState([]);

    const getAllUsers = async()=>{
        try {
            const result = await getAllUsers();
            if(result.status === 'success') {
                setAllUsers(result.data);
            }
        } catch (error) {
            console.log("Error fetching users:", error);
        }
        useEffect(()=>{
            getAllUsers();
        },[]);

        console.log("All users:", allUsers);
    }

  return (
    <Layout >
        <motion.div 
        initial={{opacity:0}} 
        animate={{opacity:1}} 
        transition={{duration:0.5}}
        className='h-full '>
           ,<ChatList contacts = {allUsers} setSelectedContact={setSelectedContect}/>
            <ChatWindow/>
            <Sidebar/>
            <UserDetails/> 
        </motion.div>
    </Layout>
  )
}

export default HomePage