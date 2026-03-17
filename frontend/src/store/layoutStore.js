import { get } from 'react-hook-form';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';


const userLayoutStore = create(
    persist((set) => ({
        activTab: 'chat',
        selectedContect: null,
        setSelectedContect: (contact) => {
            set({ selectedContect: contact })
        },
        setActivTab: (tab) => {
            set({ activTab: tab })
        },
    }),
        {
            name: "layout-storage",
            getStorage: () => localStorage
        }

    ));

export default userLayoutStore;