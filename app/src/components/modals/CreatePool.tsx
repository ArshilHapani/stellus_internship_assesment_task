"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

import { DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import FormInput from "../FormInput";
import Modal from ".";

export type FormSchema = {
  title: string;
  description: string;
  image: string;
  apy: string;
  tokenMint: string;
  minimumStakeDurationInDays: string;
};

enum FORM_STATE {
  Initial,
  Second,
}

const CreatePool = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setError,
  } = useForm<FormSchema>();
  const [formState, setFormState] = useState(FORM_STATE.Initial);
  const loading = false;

  const handleNext = () => {
    const title = getValues("title");
    const description = getValues("description");
    const image = getValues("image");

    if (!title || !description || !image) {
      setError("title", { message: "Please fill all the fields" });
      setError("description", { message: "Please fill all the fields" });
      setError("image", { message: "Please fill all the fields" });
      return;
    }
    setFormState(FORM_STATE.Second);
  };

  const handleBack = () => {
    setFormState(FORM_STATE.Initial);
  };

  async function onSubmit(data: FormSchema) {
    console.log(data);
    toast.info("This feature will available soon");
  }

  let formContent: React.ReactNode = null;

  if (formState === FORM_STATE.Initial) {
    formContent = (
      <>
        <FormInput<FormSchema>
          label="Pool name"
          name="title"
          register={register}
          isInvalid={!!errors.title}
          required
          placeholder="Enter pool name"
          errorMessage="Pool name is required"
          type="text"
          disabled={loading}
        />
        <FormInput<FormSchema>
          label="Description"
          name="description"
          register={register}
          isInvalid={!!errors.description}
          required
          placeholder="Enter description"
          errorMessage="Description is required"
          type="text"
          isTextArea
          disabled={loading}
        />
        <FormInput<FormSchema>
          label="Image"
          name="image"
          register={register}
          isInvalid={!!errors.image}
          required
          placeholder="Enter image url"
          errorMessage="Please enter valid image URL"
          type="text"
          disabled={loading}
        />
        <div className="flex justify-end">
          <Button type="button" disabled={loading} onClick={handleNext}>
            Next
          </Button>
        </div>
      </>
    );
  } else if (formState === FORM_STATE.Second) {
    formContent = (
      <>
        <FormInput<FormSchema>
          label="APY"
          name="apy"
          register={register}
          isInvalid={!!errors.apy}
          required
          placeholder="Enter APY"
          errorMessage="APY is required (in % between 0-100)"
          type="number"
          pattern={/^(100|[1-9]?[0-9])$/}
          disabled={loading}
        />
        <FormInput<FormSchema>
          label="Token mint"
          name="tokenMint"
          register={register}
          isInvalid={!!errors.tokenMint}
          required
          placeholder="Enter token mint address with valid length"
          errorMessage="Please enter valid token mint"
          type="text"
          pattern={/^[1-9A-HJ-NP-Za-km-z]{43,44}$/}
          disabled={loading}
        />

        <FormInput<FormSchema>
          label="Minimum stake duration (in days)"
          name="minimumStakeDurationInDays"
          register={register}
          isInvalid={!!errors.minimumStakeDurationInDays}
          required
          placeholder="Enter minimum stake duration"
          errorMessage="Minimum stake duration is required"
          type="number"
          disabled={loading}
        />

        <div className="flex justify-between">
          <Button type="button" onClick={handleBack} disabled={loading}>
            Back
          </Button>
          <Button disabled={loading} type="submit">
            Create
          </Button>
        </div>
      </>
    );
  }

  return (
    <Modal type="create-pool" className="transition duration-300">
      <DialogHeader>
        <DialogTitle>Create Pool</DialogTitle>
        <DialogDescription>
          Create a new pool associated with wallet address.
        </DialogDescription>
      </DialogHeader>

      <AnimatePresence mode="wait">
        <motion.form
          key={formState}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 mt-3"
          onSubmit={handleSubmit(onSubmit)}
        >
          {formContent}
        </motion.form>
      </AnimatePresence>
    </Modal>
  );
};

export default CreatePool;
