import { create } from "zustand";

export type ModalType = "create-pool" | `stake-pool-${string}`;

interface ModalState {
  type: ModalType | null;
  isOpen: boolean;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
}

const useModal = create<ModalState>((set) => ({
  isOpen: false,
  openModal: (type: ModalType) => set({ isOpen: true, type }),
  closeModal: () => set({ isOpen: false, type: null }),
  type: null,
}));

export default useModal;
