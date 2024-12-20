"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import useModal, { type ModalType } from "@/hooks/useModal";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  type: ModalType;
  className?: string;
};

const Modal = ({ children, type, className }: Props) => {
  const { type: stateType, isOpen, closeModal } = useModal();
  const isOpenModal = stateType === type && isOpen;
  return (
    <Dialog open={isOpenModal} onOpenChange={closeModal}>
      <DialogContent className={cn("w-[425px]", className)}>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
