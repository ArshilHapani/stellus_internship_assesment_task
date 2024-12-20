"use client";

import React from "react";
import type { FieldValues, Path, UseFormRegister } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export interface FormInputInterface<T extends FieldValues> {
  label: string;
  register: UseFormRegister<T>;
  name: keyof T;
  errorMessage?: string;
  isInvalid?: boolean;
  required?: boolean;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "date"
    | "datetime-local"
    | "time"
    | "week"
    | "month"
    | "tel"
    | "url";
  disabled?: boolean;
  pattern?: RegExp;
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  className?: string;
  isTextArea?: boolean;
  textAreaClassName?: string;
  inputFieldClassName?: string;
}

function FormInput<FormSchema extends FieldValues>({
  label,
  name,
  register,
  disabled = false,
  errorMessage,
  isInvalid,
  maxLength,
  minLength,
  pattern,
  placeholder = "",
  required = false,
  type = "text",
  className = "",
  isTextArea = false,
  textAreaClassName = "",
  inputFieldClassName = "",
}: FormInputInterface<FormSchema>) {
  return (
    <>
      <div className="grid w-full items-center gap-1.5">
        <Label
          htmlFor={type}
          className={cn(className, {
            "text-destructive": isInvalid,
          })}
        >
          {isInvalid ? errorMessage : label}
        </Label>
        {isTextArea ? (
          <Textarea
            {...register(name as Path<FormSchema>, {
              required,
              pattern,
              maxLength,
              minLength,
            })}
            placeholder={placeholder}
            disabled={disabled}
            className={textAreaClassName}
          />
        ) : (
          <Input
            className={cn(inputFieldClassName, {
              "border-destructive": isInvalid,
            })}
            type={type}
            {...register(name as Path<FormSchema>, {
              required,
              pattern,
              maxLength,
              minLength,
            })}
            placeholder={placeholder}
            disabled={disabled}
          />
        )}
      </div>
    </>
  );
}

export default FormInput;
