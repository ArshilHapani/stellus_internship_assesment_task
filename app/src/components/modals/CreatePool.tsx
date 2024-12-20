"use client";

import useModal from "@/hooks/useModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const CreatePool = () => {
  const { closeModal, type, isOpen } = useModal();
  const open = type === "create-pool" && isOpen;
  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Pool</DialogTitle>
          <DialogDescription>
            Create a new pool associated with wallet address.
          </DialogDescription>
        </DialogHeader>

        <form></form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePool;
