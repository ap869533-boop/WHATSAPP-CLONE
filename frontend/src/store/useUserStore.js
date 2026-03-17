
import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import { checkUserAuth } from '../services/user.service.js';



const userUserStore = create(
  persist((set) => ({
    user:0,
    isAuthenticated:false,
    setUser:(userData)=>{
        set({user:userData,isAuthenticated:true})
    },
    clearUser:()=>{
        set({user:null,isAuthenticated:false})
    },
     checkAuth: async () => {
      try {
        const result = await checkUserAuth();

        if (result?.isAuthenticated) {
          set({ user: result.user, isAuthenticated: true });
        } else {
          set({ user: null, isAuthenticated: false });
        }

        return result;
      } catch (error) {
        set({ user: null, isAuthenticated: false });
        return { isAuthenticated: false };
      }
    }

  }),

   {
    name:"user-storage",
    getStorage: () => localStorage  
   }

)); 

export default userUserStore;