import { create } from 'zustand';

export const useStore = create((set) => ({
  selectedPicoPlacaItems: [],
  picoPlacaCostState: 0,
  selectedCalendarDays: [],
  totalSelectedDays: 0,
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  selecDias: false,

  // Actions
  addPicoPlacaItem: (item) => set((state) => {
    const existingIndex = state.selectedPicoPlacaItems.findIndex(
      i => i.type === item.type && i.month === item.month
    );
    
    if (existingIndex >= 0) {
      const updatedItems = [...state.selectedPicoPlacaItems];
      updatedItems[existingIndex] = item;
      return { selectedPicoPlacaItems: updatedItems };
    }
    
    return { selectedPicoPlacaItems: [...state.selectedPicoPlacaItems, item] };
  }),

  removePicoPlacaItem: (index) => set((state) => {
    const updatedItems = [...state.selectedPicoPlacaItems];
    updatedItems.splice(index, 1);
    return { selectedPicoPlacaItems: updatedItems };
  }),

  setPicoPlacaCostState: (cost) => set({ picoPlacaCostState: cost }),
  setSelectedCalendarDays: (days) => set({ selectedCalendarDays: days }),
  setTotalSelectedDays: (count) => set({ totalSelectedDays: count }),
  setCurrentMonth: (month) => set({ currentMonth: month }),
  setCurrentYear: (year) => set({ currentYear: year }),
  setSelecDias: (value) => set({ selecDias: value }),
}));