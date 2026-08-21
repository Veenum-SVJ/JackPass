import { useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, Paperclip, X, CheckCircle2 } from 'lucide-react';
import { institutions } from '@/lib/data';
import { Combobox } from './ui/combobox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useProcessDocument, useUploadQuestion } from '@/hooks/useUpload';

const fileSchema = z.custom<FileList>()
  .refine((files) => files && files.length > 0, 'At least one file is required.')
  .refine((files) => Array.from(files).every(file => file.size <= 5000000), 'Max file size is 5MB.')
  .refine(
    (files) => Array.from(files).every(file => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)),
    'Only .jpg, .png, and .pdf formats are supported.'
  );

const currentYear = new Date().getFullYear();

const formSchema = z.object({
  institution: z.string().min(1, 'Please select an institution.'),
  course: z.string().min(1, 'Please enter a course name.'),
  courseCode: z.string().optional(),
  year: z.string().min(1, 'Academic year is required'),
  semester: z.enum(['First', 'Second']),
  questionFiles: fileSchema.optional(),
  fileUrl: z.string().url("Please enter a valid URL.").or(z.literal('')).optional(),
}).refine(data => data.questionFiles || data.fileUrl, {
  message: "Either a file or a URL must be provided.",
  path: ["questionFiles"],
});

type FormValues = z.infer<typeof formSchema>;

export function UploadDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const processDocument = useProcessDocument();
  const uploadQuestion = useUploadQuestion();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      institution: '',
      course: '',
      courseCode: '',
      year: `${currentYear}/${currentYear + 1}`,
      semester: 'First',
      questionFiles: undefined,
      fileUrl: '',
    },
  });

  const institutionOptions = institutions.map(inst => ({
    value: inst.name,
    label: inst.name,
  }));

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const newFiles = Array.from(files);
    const allFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(allFiles);

    const dataTransfer = new DataTransfer();
    allFiles.forEach(file => dataTransfer.items.add(file));
    form.setValue('questionFiles', dataTransfer.files, { shouldValidate: true });
    form.clearErrors('fileUrl');

    // Scan the first file for content
    const firstFile = allFiles[0];
    if (firstFile) {
      processFile(firstFile);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file));
    form.setValue('questionFiles', newFiles.length > 0 ? dataTransfer.files : undefined, { shouldValidate: true });
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    toast({
      title: 'Processing file...',
      description: 'Scanning image with AI to read its contents. This may take a moment.',
    });

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUri = reader.result as string;

      try {
        // Run the Genkit document flow on the server (keeps API keys off the client)
        const result = await processDocument.mutateAsync({ fileUrl: dataUri });
        if (result.institutionName) form.setValue('institution', result.institutionName, { shouldValidate: true });
        if (result.courseName) form.setValue('course', result.courseName, { shouldValidate: true });
        if (result.examYear) form.setValue('year', String(result.examYear), { shouldValidate: true });
        if (result.semester) form.setValue('semester', result.semester, { shouldValidate: true });
        toast({
          title: 'Image Scanned!',
          description: "We've read the image and pre-filled the form. Please review and submit.",
        });
      } catch (error) {
        console.error('Error processing file:', error);
        toast({
          variant: 'destructive',
          title: 'Scan Failed',
          description: 'Could not read the image content. Please fill the form manually.',
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProcessLink = async () => {
    const linkValue = form.getValues('fileUrl');
    if (!linkValue) {
      toast({
        variant: 'destructive',
        title: 'No Link Provided',
        description: 'Please paste a Google Drive link to process.',
      });
      return;
    }

    setIsProcessing(true);
    toast({
      title: 'Processing document...',
      description: 'This may take a moment.',
    });
    try {
      const result = await processDocument.mutateAsync({ fileUrl: linkValue });
      form.setValue('institution', result.institutionName, { shouldValidate: true });
      form.setValue('course', result.courseName, { shouldValidate: true });
      form.setValue('year', String(result.examYear), { shouldValidate: true });
      form.setValue('semester', result.semester, { shouldValidate: true });
      form.setValue('fileUrl', linkValue, { shouldValidate: true });
      form.setValue('questionFiles', undefined);
      setSelectedFiles([]);
      form.clearErrors('questionFiles');
      toast({
        title: 'Document Processed!',
        description: "We've read the document and pre-filled the form. Please review and submit.",
      });
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        variant: 'destructive',
        title: 'Processing Failed',
        description: 'Could not process the document from the link. Please check the link or fill the form manually.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to upload questions. Please log in first.',
      });
      return;
    }

    if (!data.institution || !data.course || !data.year || !data.semester) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all required fields: Institution, Course, Year, and Semester.',
      });
      return;
    }

    if (!data.questionFiles && !data.fileUrl) {
      toast({
        variant: 'destructive',
        title: 'No Content Provided',
        description: 'Please either upload files or provide a link to the question paper.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await uploadQuestion.mutateAsync({
        institution: data.institution,
        course: data.course,
        courseCode: data.courseCode,
        year: data.year,
        semester: data.semester,
        files: data.questionFiles ? Array.from(data.questionFiles) : undefined,
        fileUrl: data.fileUrl || undefined,
      });

      toast({
        title: 'Upload Successful!',
        description: (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            Your question paper(s) have been submitted for review.
          </span>
        ),
      });

      form.reset();
      setSelectedFiles([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDialogOpenChange = (open: boolean) => {
    if (!open) {
      form.reset({
        institution: '',
        course: '',
        courseCode: '',
        year: `${currentYear}/${currentYear + 1}`,
        semester: 'First',
        questionFiles: undefined,
        fileUrl: '',
      });
      setSelectedFiles([]);
    }
    setIsOpen(open);
  };

  const handleTriggerClick = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to upload a question.",
      });
      navigate('/login');
    } else {
      setIsOpen(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onDialogOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleTriggerClick}>
          <UploadCloud className="mr-2 h-5 w-5" />
          Upload Past Question
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Past Question(s)</DialogTitle>
          <DialogDescription>
            Contribute to the community by uploading new question papers.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="file-upload">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file-upload" onClick={() => {
                  form.clearErrors('fileUrl');
                }}>Upload File(s)</TabsTrigger>
                <TabsTrigger value="link-import" onClick={() => {
                  form.clearErrors('questionFiles');
                }}>Import from Link</TabsTrigger>
              </TabsList>
              <TabsContent value="file-upload" className="pt-4">
                <FormField
                  control={form.control}
                  name="questionFiles"
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <div>
                          <Label htmlFor="file-upload" className="relative flex justify-center w-full h-24 px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer border-border hover:border-primary">
                            <div className="space-y-1 text-center">
                              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                              <div className="flex text-sm text-muted-foreground">
                                <span className="font-medium text-primary">
                                  Click to upload
                                </span>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-muted-foreground">PDF, PNG, JPG up to 5MB each</p>
                            </div>
                          </Label>
                          <Input
                            id="file-upload"
                            type="file"
                            multiple
                            className="sr-only"
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, application/pdf"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      {selectedFiles.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <h4 className="text-sm font-medium">Selected Files:</h4>
                          <div className="space-y-2">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 text-sm rounded-md bg-muted">
                                <div className="flex items-center gap-2 truncate">
                                  <Paperclip className="h-4 w-4" />
                                  <span className="truncate">{file.name}</span>
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="link-import" className="pt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Drive Link</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Paste public Google Drive link here"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              form.clearErrors('questionFiles');
                              setSelectedFiles([]);
                              form.setValue('questionFiles', undefined);
                            }}
                          />
                          <Button type="button" onClick={handleProcessLink} disabled={isProcessing}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Process
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Institution</FormLabel>
                  <Combobox
                    options={institutionOptions}
                    placeholder="Select an institution"
                    searchPlaceholder="Search institutions..."
                    value={field.value}
                    onSelect={(value) => {
                      field.onChange(value);
                      form.setValue('institution', value, { shouldValidate: true });
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="course"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Engineering Mathematics" {...field} disabled={isProcessing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2025/2026" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="courseCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CSC 301" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

              <FormField
                control={form.control}
                name="semester"
                render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="First">First Semester</SelectItem>
                      <SelectItem value="Second">Second Semester</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isProcessing || isSubmitting}>
                {(isProcessing || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? 'Processing...' : 'Submit for Review'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
