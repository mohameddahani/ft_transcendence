/* eslint-disable @next/next/no-img-element */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { toast } from "react-toastify";
import { Mail, MessageSquareText } from "lucide-react";

const ContactUs = () => {
  const formSchema = z.object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters.")
      .max(30, "First name must be at most 30 characters.")
      .regex(
        /^[a-zA-Z- ]+$/,
        "First name can only contain letters, spaces, and hyphens",
      )
      .trim(),

    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters.")
      .max(30, "Last name must be at most 30 characters.")
      .regex(
        /^[a-zA-Z\- ]+$/,
        "Last name can only contain letters, spaces, and hyphens",
      )
      .trim(),

    email: z.string().email("Please enter a valid email address").trim(),

    description: z
      .string()
      .min(20, "Description must be at least 20 characters.")
      .max(100, "Description must be at most 100 characters."),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      description: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    toast.success("Your message has been sent successfully!");
    console.log(data);
    form.reset();
  }

  return (
    <section className="mt-40 grid grid-cols-2 gap-15 max-lg:grid-cols-1">
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-4xl font-semibold mt-10">
              Let{"'"}s get your gym flowing
            </CardTitle>

            <CardDescription className="my-5">
              Tell us about your gym and how we can help you get started with
              GymFlow.
            </CardDescription>
          </CardHeader>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-5">
                  <Controller
                    name="firstName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="form-rhf-demo-first-name">
                          First Name
                        </FieldLabel>

                        <Input
                          {...field}
                          id="form-rhf-demo-first-name"
                          aria-invalid={fieldState.invalid}
                          placeholder="First Name"
                          autoComplete="off"
                          className="p-6"
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="lastName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="form-rhf-demo-last-name">
                          Last Name
                        </FieldLabel>

                        <Input
                          {...field}
                          id="form-rhf-demo-last-name"
                          aria-invalid={fieldState.invalid}
                          placeholder="Last Name"
                          autoComplete="off"
                          className="p-6"
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="form-rhf-demo-email">
                        Work Email
                      </FieldLabel>

                      <Input
                        {...field}
                        id="form-rhf-demo-email"
                        aria-invalid={fieldState.invalid}
                        placeholder="Work Email"
                        autoComplete="off"
                        className="p-6"
                      />

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="form-rhf-demo-description">
                        Tell us about your gym
                      </FieldLabel>

                      <InputGroup>
                        <InputGroupTextarea
                          {...field}
                          id="form-rhf-demo-description"
                          placeholder="Tell us about your gym"
                          rows={6}
                          className="min-h-24 resize-none p-6"
                          aria-invalid={fieldState.invalid}
                        />

                        <InputGroupAddon align="block-end">
                          <InputGroupText className="tabular-nums p-6">
                            {field.value.length}/100 characters
                          </InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>

                      <FieldDescription>
                        Tell us about your gym, your current software, or what
                        you would like to achieve with GymFlow.
                      </FieldDescription>

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>

            <CardFooter className="flex items-center justify-center">
              <Button
              type="submit"
                size={"lg"}
                className={
                  "w-full shadow-lg rounded-full text-md p-6 btn-primary-gradient"
                }
              >
                Send Message
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="flex flex-col gap-10 h-full">
        <div className="h-full p-20 rounded-3xl bg-green-50 border border-green-200 flex flex-col items-center text-center gap-5">
          <img className="w-12 h-12" src="/whatsapp.svg" alt="" />

          <h3 className="text-green-900 font-bold text-3xl">
            Prefer WhatsApp?
          </h3>

          <p className="font-light  text-green-800 ">
            Chat with us directly to get your gym activated instantly. Our
            agents are standing by.
          </p>

          <button className="bg-green-500 hover:bg-green-600 text-white px-10 py-3 rounded-full flex items-center gap-2 transition-all shadow-md">
            <MessageSquareText />
            Chat on WhatsApp
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-secondary border flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Mail />
          </div>

          <div>
            <div className="text-sm uppercase opacity-60">Support</div>

            <div className="text-lg">support@gymflow.saas</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
