'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, UploadCloud } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(1, 'Please enter your name.'),
  email: z.string().email('Please enter a valid email address.'),
  institution: z.string().min(1, 'Please enter your institution.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
  attachment: z.custom<FileList>().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const faqs = [
    {
        question: "How do I upload past questions?",
        answer: "Navigate to the homepage and click the 'Upload Past Question' button in the bottom bar. You can either drag and drop your file or click to select a file from your device. We support PDF, JPG, and PNG formats."
    },
    {
        question: "What if my past question is not categorized?",
        answer: "Our AI system attempts to automatically categorize your upload based on the institution and course name it detects. If it fails or gets it wrong, you can manually select the correct details from the dropdown menus in the upload form."
    },
    {
        question: "Can I use my phone camera to upload?",
        answer: "Yes, you can. On mobile devices, when you click 'Upload a file', you will have the option to use your camera to take a picture of the past question paper directly."
    },
    {
        question: "How do I report errors in a question?",
        answer: "If you find an error in a question, answer, or explanation, please use the contact form on this page to let us know. Include the title of the question paper and a description of the error. We appreciate your help in keeping our content accurate."
    }
]

export default function SupportPage() {
    const { toast } = useToast();
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          name: '',
          email: '',
          institution: '',
          message: '',
        },
      });

    const onSubmit = (data: FormValues) => {
        console.log('Support form submitted:', data);
        toast({
          title: 'Message Sent!',
          description: 'Our support team will get back to you shortly.',
        });
        form.reset();
    };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <section className="text-center py-12 px-4">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Need Help?</h1>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Find answers, contact us, or get support from the community.
        </p>
      </section>

      <section className="mb-12 px-4">
        <h2 className="text-2xl font-bold mb-6 text-center font-headline">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
                 <AccordionItem value={`item-${i+1}`} key={i}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </section>
      
      <section className="mb-12 px-4">
        <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg text-center">
            <h3 className="font-bold font-headline text-lg">Didn't find your answer?</h3>
            <p className="text-muted-foreground mt-2 mb-4">Get help from other students and experts in our community.</p>
            <Button asChild variant="outline">
                <Link href="/community">Ask in the Community Forum <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
        </div>
      </section>

      <section className="px-4">
        <h2 className="text-2xl font-bold mb-6 text-center font-headline">Contact Support</h2>
        <div className="bg-card p-6 border rounded-lg shadow-sm">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Your Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Your Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="you@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="institution"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Institution</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., University of Lagos" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Message / Issue</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Please describe the issue you're facing in detail..." {...field} rows={5} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="attachment"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Attach File (Optional)</FormLabel>
                            <FormControl>
                            <div className="relative flex justify-center w-full h-24 px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-border">
                                <div className="space-y-1 text-center">
                                    <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                                    <div className="flex text-sm text-muted-foreground">
                                        <span className="relative font-medium rounded-md cursor-pointer text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary hover:text-primary/80">
                                            <span>Upload a file</span>
                                            <Input id="file-upload" type="file" className="sr-only" onChange={(e) => field.onChange(e.target.files)} />
                                        </span>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 5MB</p>
                                </div>
                            </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" size="lg">Send Message</Button>
                </form>
            </Form>
        </div>
      </section>
    </div>
  );
}
