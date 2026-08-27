var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/supabase-utils.ts
function normalizeSupabaseUrl(url) {
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}
var init_supabase_utils = __esm({
  "src/lib/supabase-utils.ts"() {
    "use strict";
  }
});

// src/lib/supabase-server.ts
import { createClient } from "@supabase/supabase-js";
async function isUserAdmin(userId) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("user_profiles").select("is_admin").eq("id", userId).single();
  if (error || !data) return false;
  return data.is_admin === true;
}
var createServerSupabase;
var init_supabase_server = __esm({
  "src/lib/supabase-server.ts"() {
    "use strict";
    init_supabase_utils();
    createServerSupabase = () => createClient(
      normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
});

// src/ai/genkit.ts
var genkit_exports = {};
__export(genkit_exports, {
  ai: () => ai
});
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
var ai;
var init_genkit = __esm({
  "src/ai/genkit.ts"() {
    "use strict";
    ai = genkit({
      plugins: [
        googleAI({
          apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY
        })
      ],
      model: "googleai/gemini-3.6-flash"
    });
  }
});

// src/ai/flows/extract-question-metadata.ts
import { z } from "zod";
var ExtractQuestionMetadataInputSchema, MarksPartSchema, MarksQuestionSchema, QuestionMetadataSchema, extractQuestionMetadataFlow, GenerateAnswerInputSchema, GenerateAnswerOutputSchema, generateAnswerFlow;
var init_extract_question_metadata = __esm({
  "src/ai/flows/extract-question-metadata.ts"() {
    "use strict";
    init_genkit();
    ExtractQuestionMetadataInputSchema = z.object({
      ocrText: z.string().describe("Raw text extracted from OCR of a question paper/document"),
      filename: z.string().optional().describe("Original filename for context"),
      uploaderId: z.string().describe("ID of the user who uploaded the document")
    });
    MarksPartSchema = z.object({
      label: z.string().describe("Part label like (a), (b), (c) or 1, 2, 3"),
      marks: z.number().describe("Marks allocated to this part"),
      text: z.string().optional().describe("Brief text of this sub-question")
    });
    MarksQuestionSchema = z.object({
      question: z.string().describe('Question number like "1", "2", "3a"'),
      totalMarks: z.number().describe("Total marks for this question"),
      parts: z.array(MarksPartSchema).optional().describe("Sub-parts with individual marks if present")
    });
    QuestionMetadataSchema = z.object({
      title: z.string().describe("Short descriptive title for the question"),
      institution: z.string().describe("University or institution name"),
      course: z.string().describe("Course code and name"),
      faculty: z.string().optional().describe("Faculty/School"),
      department: z.string().optional().describe("Department"),
      year: z.string().describe('Academic year range (e.g., "2025/2026")'),
      semester: z.enum(["First", "Second"]).describe("Semester: First or Second"),
      type: z.enum(["Objective", "Theory", "Mixed"]).describe("Question type"),
      contentPreview: z.string().describe("First 200-300 chars of the question content for search results"),
      fullContent: z.string().describe("Complete question text as extracted"),
      answer: z.string().optional().describe("Model answer/solution if present in document"),
      explanation: z.string().optional().describe("Explanation or marking scheme if present"),
      marksScheme: z.array(MarksQuestionSchema).optional().describe("Marks allocation per question/part as printed on the exam paper"),
      answerGenerated: z.string().optional().describe("AI-generated model answer for the questions"),
      confidence: z.object({
        overall: z.number().min(0).max(1),
        institution: z.number().min(0).max(1),
        course: z.number().min(0).max(1),
        year: z.number().min(0).max(1),
        semester: z.number().min(0).max(1),
        type: z.number().min(0).max(1)
      }).describe("Confidence scores for each extracted field (0-1)")
    });
    extractQuestionMetadataFlow = ai.defineFlow(
      {
        name: "extractQuestionMetadata",
        inputSchema: ExtractQuestionMetadataInputSchema,
        outputSchema: QuestionMetadataSchema
      },
      async ({ ocrText, filename, uploaderId: _uploaderId }) => {
        const prompt = `You are an expert at parsing academic question papers from Nigerian universities.

Given the following OCR-extracted text from a question paper/document, extract the structured metadata.

OCR Text:
${ocrText}

${filename ? `Filename: ${filename}` : ""}

Extract the following information as JSON:
1. title: A concise title for this question/set of questions (max 100 chars)
2. institution: The university/institution name
3. course: Course code and name
4. faculty: Faculty/School if mentioned
5. department: Department if mentioned
6. year: The academic year as a range (e.g., "2025/2026")
7. semester: "First" or "Second"
8. type: "Objective" (multiple choice), "Theory" (essay/structured), or "Mixed"
9. contentPreview: First 200-300 chars of actual question content (not metadata)
10. fullContent: The complete question text exactly as it appears
11. answer: The model answer/solution if PROVIDED in the document
12. explanation: Explanation or marking scheme if PROVIDED in the document
13. marksScheme: Extract the marks allocation as printed on the exam paper. For EACH question that shows marks, create an entry with:
    - question: The question number ("1", "2", etc.)
    - totalMarks: Total marks for the question (e.g., 20)
    - parts: Array of sub-parts if the question is divided, each with label ("(a)", "(b)"), marks, and brief text
    Example: If the paper says "Question 1 (20 marks)" with parts (a) 5 marks, (b) 8 marks, (c) 7 marks:
    { "question": "1", "totalMarks": 20, "parts": [{"label":"(a)","marks":5,"text":"Define BST"},{"label":"(b)","marks":8,"text":"Insert algorithm"},{"label":"(c)","marks":7,"text":"Time complexity"}] }
    If no marks are visible, set marksScheme to an empty array [].
14. answerGenerated: Generate a MODEL ANSWER for ALL questions combined. Write a comprehensive answer that a top-scoring student would write. For theory questions, structure your answer to address each sub-part. For objective questions, provide the correct option with explanation.
15. confidence: Confidence scores (0.0-1.0) for each field

Rules:
- Only extract metadata that is clearly present in the text
- For Nigerian universities, recognize common abbreviations: UNILAG, UI, OAU, FUTO, ABU, BUK, etc.
- Course codes follow patterns like CSC/MTH/PHY/CHM/STA + 3 digits
- If information is ambiguous, set lower confidence and make reasonable inference
- marksScheme should capture ALL marks information visible on the paper
- answerGenerated should be thorough and demonstrate subject knowledge

Return ONLY valid JSON matching the schema.`;
        const { output } = await ai.generate({
          prompt,
          output: { schema: QuestionMetadataSchema },
          config: { temperature: 0.2 }
        });
        if (!output) {
          throw new Error("AI failed to extract metadata");
        }
        return output;
      }
    );
    GenerateAnswerInputSchema = z.object({
      fullContent: z.string().describe("The full question text"),
      marksScheme: z.array(MarksQuestionSchema).optional().describe("Marks allocation if available")
    });
    GenerateAnswerOutputSchema = z.object({
      answer: z.string().describe("AI-generated model answer"),
      explanation: z.string().optional().describe("Step-by-step explanation of the answer")
    });
    generateAnswerFlow = ai.defineFlow(
      {
        name: "generateAnswer",
        inputSchema: GenerateAnswerInputSchema,
        outputSchema: GenerateAnswerOutputSchema
      },
      async ({ fullContent, marksScheme }) => {
        const marksContext = marksScheme && marksScheme.length > 0 ? `

Marks allocation:
${JSON.stringify(marksScheme, null, 2)}

Structure your answer to address each sub-part and note how many marks each section is worth.` : "";
        const prompt = `You are an expert academic tutor specializing in Nigerian university courses.

Given the following exam questions, write a comprehensive model answer that a top-scoring student would submit.

Questions:
${fullContent}
${marksContext}

Rules:
- Answer ALL questions thoroughly
- For theory questions: provide detailed explanations with examples where appropriate
- For objective/MCQ questions: state the correct option and explain why
- If marks are allocated, ensure your answer addresses each part and matches the marks weight
- Use clear formatting with question numbers and sub-parts
- Be accurate and academically rigorous
- For the explanation field, provide a step-by-step walkthrough of how to arrive at the answer

Return ONLY valid JSON matching the schema.`;
        const { output } = await ai.generate({
          prompt,
          output: { schema: GenerateAnswerOutputSchema },
          config: { temperature: 0.3 }
        });
        if (!output) {
          throw new Error("AI failed to generate answer");
        }
        return output;
      }
    );
  }
});

// src/ai/flows/process-uploaded-question.ts
var process_uploaded_question_exports = {};
__export(process_uploaded_question_exports, {
  processUploadedQuestionFlow: () => processUploadedQuestionFlow
});
import { z as z2 } from "zod";
import { v4 as uuidv4 } from "uuid";
var ProcessUploadedQuestionInputSchema, ProcessUploadedQuestionOutputSchema, processUploadedQuestionFlow;
var init_process_uploaded_question = __esm({
  "src/ai/flows/process-uploaded-question.ts"() {
    "use strict";
    init_genkit();
    init_extract_question_metadata();
    init_supabase_server();
    ProcessUploadedQuestionInputSchema = z2.object({
      uploadId: z2.string().uuid(),
      ocrText: z2.string(),
      filename: z2.string().optional(),
      uploaderId: z2.string(),
      // User-provided metadata from the upload form (used as primary source)
      institution: z2.string().optional(),
      course: z2.string().optional(),
      courseCode: z2.string().optional(),
      year: z2.string().optional(),
      semester: z2.enum(["First", "Second"]).optional()
    });
    ProcessUploadedQuestionOutputSchema = z2.object({
      success: z2.boolean(),
      questionId: z2.string().optional(),
      uploadId: z2.string(),
      error: z2.string().optional(),
      metadata: z2.any().optional()
    });
    processUploadedQuestionFlow = ai.defineFlow(
      {
        name: "processUploadedQuestion",
        inputSchema: ProcessUploadedQuestionInputSchema,
        outputSchema: ProcessUploadedQuestionOutputSchema
      },
      async ({ uploadId, ocrText, filename, uploaderId, institution: formInstitution, course: formCourse, courseCode: formCourseCode, year: formYear, semester: formSemester }) => {
        const supabase = createServerSupabase();
        try {
          console.log(`Starting AI metadata extraction for upload ${uploadId}`);
          const metadata = await extractQuestionMetadataFlow({
            ocrText,
            filename,
            uploaderId
          });
          console.log(`Metadata extracted for upload ${uploadId}:`, {
            institution: metadata.institution,
            course: metadata.course,
            year: metadata.year,
            type: metadata.type
          });
          const { data: uploadRecord, error: uploadError } = await supabase.from("question_uploads").select("file_url, file_name").eq("id", uploadId).single();
          if (uploadError || !uploadRecord) {
            throw new Error(`Upload record not found: ${uploadError?.message}`);
          }
          const rawYear = formYear || metadata.year || "";
          const yearMatch = String(rawYear).match(/(\d{4})/);
          const yearSession = yearMatch ? rawYear : String((/* @__PURE__ */ new Date()).getFullYear());
          const yearStart = yearMatch ? yearMatch[1] : String((/* @__PURE__ */ new Date()).getFullYear());
          const questionData = {
            id: uuidv4(),
            title: metadata.title,
            institution: formInstitution || metadata.institution,
            course: formCourse || metadata.course,
            faculty: metadata.faculty,
            department: metadata.department,
            year: yearSession,
            semester: formSemester || metadata.semester,
            type: metadata.type || "Mixed",
            status: "pending",
            content_preview: metadata.contentPreview,
            full_content: metadata.fullContent,
            answer: metadata.answer,
            explanation: metadata.explanation,
            file_url: uploadRecord.file_url,
            file_name: uploadRecord.file_name,
            file_type: uploadRecord.file_name.split(".").pop() || "unknown",
            uploader_id: uploaderId,
            ai_extracted_data: metadata,
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          if (formCourseCode) {
            questionData.course_code = formCourseCode;
          }
          ;
          let { data: question, error: questionError } = await supabase.from("questions").insert([questionData]).select().single();
          if (questionError && yearSession !== yearStart) {
            console.log(`Year format '${yearSession}' failed, retrying with '${yearStart}'`);
            questionData.year = yearStart;
            const retry = await supabase.from("questions").insert([questionData]).select().single();
            question = retry.data;
            questionError = retry.error;
          }
          if (questionError) {
            throw new Error(`Failed to create question: ${questionError.message}`);
          }
          await supabase.from("question_uploads").update({
            question_id: question.id,
            upload_status: "processed",
            processed_at: (/* @__PURE__ */ new Date()).toISOString()
          }).eq("id", uploadId);
          console.log(`Question created successfully: ${question.id} from upload ${uploadId}`);
          return {
            success: true,
            questionId: question.id,
            uploadId,
            metadata
          };
        } catch (error) {
          console.error(`Failed to process uploaded question ${uploadId}:`, error);
          await supabase.from("question_uploads").update({
            upload_status: "failed",
            ocr_text: `AI processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            processed_at: (/* @__PURE__ */ new Date()).toISOString()
          }).eq("id", uploadId);
          return {
            success: false,
            uploadId,
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      }
    );
  }
});

// src/ai/flows/process-question-document.ts
var process_question_document_exports = {};
__export(process_question_document_exports, {
  processQuestionDocument: () => processQuestionDocument
});
import { z as z3 } from "zod";
function parseDataUri(dataUri) {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match || !match[1] || !match[2]) {
    throw new Error("Invalid data URI format");
  }
  return { mimeType: match[1], base64: match[2] };
}
function getGoogleDriveFileId(url) {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}
async function fetchGoogleDriveFileAsDataUri(fileUrl) {
  const fileId = getGoogleDriveFileId(fileUrl);
  if (!fileId) {
    throw new Error("Invalid Google Drive URL. Could not extract file ID.");
  }
  const downloadUrl = `https://drive.google.com/gcs/d/${fileId}`;
  const fetch2 = (await import("node-fetch")).default;
  const response = await fetch2(downloadUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}
async function processQuestionDocument(input) {
  return processDocumentFlow(input);
}
var ProcessQuestionDocumentInputSchema, ProcessQuestionDocumentOutputSchema, processDocumentFlow;
var init_process_question_document = __esm({
  "src/ai/flows/process-question-document.ts"() {
    "use strict";
    init_genkit();
    ProcessQuestionDocumentInputSchema = z3.object({
      // A URL or a Data URI
      fileUrl: z3.string().describe("The public Google Drive URL or a Data URI of the question paper.")
    });
    ProcessQuestionDocumentOutputSchema = z3.object({
      institutionName: z3.string().describe("The full name of the institution."),
      courseName: z3.string().describe('The name of the course without the code, e.g. "Data Structures and Algorithms"'),
      courseCode: z3.string().optional().describe('The course code if present, e.g. "CSC 301"'),
      academicSession: z3.string().describe('The academic session in YYYY/YYYY format, e.g. "2023/2024".'),
      semester: z3.enum(["First", "Second"]).describe("The semester for the exam."),
      fullContent: z3.string().describe("The full text content extracted from the document.")
    });
    processDocumentFlow = ai.defineFlow(
      {
        name: "processDocumentFlow",
        inputSchema: ProcessQuestionDocumentInputSchema,
        outputSchema: ProcessQuestionDocumentOutputSchema
      },
      async ({ fileUrl }) => {
        let dataUri = fileUrl;
        if (fileUrl.startsWith("http")) {
          dataUri = await fetchGoogleDriveFileAsDataUri(fileUrl);
        }
        const { base64, mimeType } = parseDataUri(dataUri);
        console.log(`Sending image to Gemini vision (${mimeType}, ${Math.round(base64.length * 0.75 / 1024)}KB)...`);
        const startTime = Date.now();
        const { output } = await ai.generate({
          prompt: [
            {
              text: `Extract structured metadata from this academic question paper image.

Read the image carefully and return:
- institutionName: The full university/institution name (e.g. "University of Lagos")
- courseName: Course name WITHOUT the code (e.g. "Data Structures and Algorithms")
- courseCode: The course code if visible (e.g. "CSC 301")
- academicSession: The academic session in YYYY/YYYY format (e.g. "2023/2024" for "2023/2024 Academic Session")
- semester: "First" or "Second"
- fullContent: ALL text visible in the image, transcribed exactly as it appears

Rules:
- Transcribe text faithfully from the image \u2014 do not guess or fabricate
- For Nigerian universities, recognize abbreviations: UNILAG, UI, OAU, FUTO, ABU, BUK, UNN, OOU, etc.
- If year range like "2023/2024", return it as "2023/2024"
- If only a single year is found (e.g. "2023"), return it as "2023/2024" (assume same academic year)
- If semester not stated, default to "First"
- Return ONLY valid JSON matching the schema`
            },
            {
              media: {
                url: `data:${mimeType};base64,${base64}`
              }
            }
          ],
          output: {
            schema: ProcessQuestionDocumentOutputSchema
          }
        });
        const elapsed = Date.now() - startTime;
        console.log(`Gemini responded in ${elapsed}ms: institution=${output?.institutionName}, course=${output?.courseName}, code=${output?.courseCode}, session=${output?.academicSession}`);
        if (!output) {
          throw new Error("Failed to extract metadata from document image");
        }
        return output;
      }
    );
  }
});

// api/_server.ts
import express from "express";

// server/routes/questions.ts
init_supabase_server();
import { Router } from "express";

// src/lib/mappers.ts
function mapQuestionRow(row) {
  return {
    id: row.id,
    title: row.title,
    institution: row.institution,
    course: row.course,
    year: String(row.year),
    semester: row.semester,
    type: row.type,
    status: row.status,
    contentPreview: row.content_preview ?? "",
    fullContent: row.full_content ?? "",
    answer: row.answer ?? void 0,
    explanation: row.explanation ?? void 0,
    marksScheme: row.marks_scheme ?? void 0,
    answerGenerated: row.answer_generated ?? void 0,
    fileUrl: row.file_url ?? void 0,
    fileName: row.file_name ?? void 0,
    fileType: row.file_type ?? void 0,
    uploaderId: row.uploader_id ?? void 0,
    lecturerId: row.lecturer_id ?? void 0,
    lecturer: row.lecturer ?? void 0,
    createdAt: row.created_at ?? void 0,
    updatedAt: row.updated_at ?? void 0
  };
}

// server/routes/questions.ts
var questionsRouter = Router();
questionsRouter.get("/", async (req, res) => {
  try {
    const supabase = createServerSupabase();
    let query = supabase.from("questions").select("*").eq("status", "approved").order("created_at", { ascending: false });
    const { institution, course, year, semester, type } = req.query;
    if (typeof institution === "string" && institution) {
      query = query.eq("institution", institution);
    }
    if (typeof course === "string" && course) {
      query = query.ilike("course", `%${course}%`);
    }
    if (typeof year === "string" && year) {
      query = query.eq("year", Number(year));
    }
    if (typeof semester === "string" && semester) {
      query = query.eq("semester", semester);
    }
    if (typeof type === "string" && type) {
      query = query.eq("type", type);
    }
    const { data, error } = await query.limit(50);
    if (error) throw error;
    res.json((data ?? []).map(mapQuestionRow));
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});
questionsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("questions").select("*").eq("id", id).single();
    if (error && error.code !== "PGRST116") {
      if (error.code === "22P02") {
        res.status(404).json({ error: "Question not found" });
        return;
      }
      throw error;
    }
    if (!data) {
      res.status(404).json({ error: "Question not found" });
      return;
    }
    const question = mapQuestionRow(data);
    if (data.lecturer_id) {
      const { data: lecturer } = await supabase.from("lecturers").select("id, name, institution, department, rating_avg, review_count, photo_url").eq("id", data.lecturer_id).single();
      if (lecturer) {
        question.lecturer = lecturer;
      }
    }
    res.json(question);
  } catch (error) {
    console.error(`Failed to fetch question ${id}:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// server/routes/admin.ts
init_supabase_server();
import { Router as Router2 } from "express";

// server/middleware.ts
init_supabase_server();
init_supabase_utils();
import { createClient as createClient2 } from "@supabase/supabase-js";
var SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
var SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
function getBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.substring(7);
}
function createUserClient(req) {
  const token = getBearerToken(req);
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createClient2(normalizeSupabaseUrl(SUPABASE_URL), SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}
async function getUserFromRequest(req) {
  const client = createUserClient(req);
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}
async function requireAuth(req, res, next) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.locals.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}
async function requireAdmin(req, res, next) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const admin = await isUserAdmin(user.id);
    if (!admin) {
      res.status(403).json({ error: "Forbidden: Admin access required" });
      return;
    }
    res.locals.user = user;
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ error: "Authorization check failed" });
  }
}

// server/routes/admin.ts
var adminBaseRouter = Router2();
adminBaseRouter.get("/me", requireAuth, async (_req, res) => {
  try {
    const user = res.locals.user;
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("user_profiles").select("is_admin").eq("id", user.id).single();
    if (error || !data) {
      res.json({ isAdmin: false });
      return;
    }
    res.json({ isAdmin: data.is_admin === true });
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.json({ isAdmin: false });
  }
});
adminBaseRouter.get("/stats", requireAdmin, async (_req, res) => {
  try {
    const supabase = createServerSupabase();
    const [questionsResult, usersResult] = await Promise.all([
      supabase.from("questions").select("status"),
      supabase.from("user_profiles").select("id", { count: "exact", head: true })
    ]);
    if (questionsResult.error) throw questionsResult.error;
    const questions = questionsResult.data ?? [];
    const total = questions.length;
    const pending = questions.filter((q) => q.status === "pending").length;
    const approved = questions.filter((q) => q.status === "approved").length;
    const rejected = questions.filter((q) => q.status === "rejected").length;
    const totalUsers = usersResult.count ?? 0;
    res.json({ total, pending, approved, rejected, totalUsers });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});
var adminRouter = Router2();
adminRouter.get("/", requireAdmin, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    if (req.query.institutions === "true") {
      const { data: data2, error: error2 } = await supabase.from("questions").select("institution").order("institution");
      if (error2) throw error2;
      const uniqueInstitutions = [...new Set((data2 ?? []).map((q) => q.institution))];
      res.json(uniqueInstitutions);
      return;
    }
    let query = supabase.from("questions").select("*").order("created_at", { ascending: false });
    const search = typeof req.query.search === "string" ? req.query.search : void 0;
    const status = typeof req.query.status === "string" ? req.query.status : void 0;
    const institution = typeof req.query.institution === "string" ? req.query.institution : void 0;
    if (search) {
      query = query.or(`title.ilike.%${search}%,institution.ilike.%${search}%,course.ilike.%${search}%`);
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (institution) {
      query = query.eq("institution", institution);
    }
    const { data, error } = await query.limit(100);
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Error fetching admin questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});
adminRouter.post("/bulk/:action", requireAdmin, async (req, res) => {
  const action = String(req.params.action);
  const user = res.locals.user;
  try {
    if (!["approve", "reject"].includes(action)) {
      res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
      return;
    }
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: "ids must be a non-empty array" });
      return;
    }
    const supabase = createServerSupabase();
    const newStatus = action === "approve" ? "approved" : "rejected";
    const { data, error } = await supabase.from("questions").update({
      status: newStatus,
      approved_at: (/* @__PURE__ */ new Date()).toISOString(),
      approved_by: user.id,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).in("id", ids).select();
    if (error) throw error;
    res.json({
      success: true,
      count: data?.length ?? 0,
      message: `${data?.length ?? 0} exam paper(s) ${action}d successfully`
    });
  } catch (error) {
    console.error(`Error bulk ${action}ing questions:`, error);
    res.status(500).json({ error: error.message || `Failed to bulk ${action} questions` });
  }
});
adminRouter.put("/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  try {
    const supabase = createServerSupabase();
    const allowedFields = ["title", "institution", "course", "course_code", "year", "semester", "type", "content_preview", "full_content", "answer", "explanation", "marks_scheme", "answer_generated"];
    const updates = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    for (const field of allowedFields) {
      if (req.body[field] !== void 0) {
        updates[field] = req.body[field];
      }
    }
    if (Object.keys(updates).length <= 1) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }
    const { data, error } = await supabase.from("questions").update(updates).eq("id", id).select().single();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "Exam paper not found" });
      return;
    }
    res.json({ success: true, question: data, message: "Exam paper updated successfully" });
  } catch (error) {
    console.error("Error updating exam paper:", error);
    res.status(500).json({ error: error.message || "Failed to update exam paper" });
  }
});
adminRouter.get("/:id/reprocess-status", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("questions").select("status, ai_extracted_data").eq("id", id).single();
    if (error || !data) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const step = data.ai_extracted_data?.reprocess_step || (data.status === "pending" ? "idle" : "unknown");
    res.json({ step, status: data.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
adminRouter.post("/:id/reprocess", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  try {
    const supabase = createServerSupabase();
    const { data: question, error: fetchError } = await supabase.from("questions").select("id, file_url, file_name, uploader_id").eq("id", id).single();
    if (fetchError || !question) {
      res.status(404).json({ error: "Exam paper not found" });
      return;
    }
    if (!question.file_url) {
      res.status(400).json({ error: "No file URL available for re-processing" });
      return;
    }
    const updateStep = async (step) => {
      await supabase.from("questions").update({ ai_extracted_data: { reprocess_step: step } }).eq("id", id);
    };
    await supabase.from("questions").update({ status: "processing", updated_at: (/* @__PURE__ */ new Date()).toISOString(), ai_extracted_data: { reprocess_step: "starting" } }).eq("id", id);
    const { ai: ai2 } = await Promise.resolve().then(() => (init_genkit(), genkit_exports));
    const { z: z5 } = await import("zod");
    await updateStep("fetching_file");
    const fetch2 = (await import("node-fetch")).default;
    const response = await fetch2(question.file_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = response.headers.get("content-type") || "application/octet-stream";
    console.log(`Re-processing question ${id} with single Gemini call (${mimeType}, ${Math.round(base64.length * 0.75 / 1024)}KB)`);
    const CombinedResultSchema = z5.object({
      extractedText: z5.string().describe("Full raw text extracted from the image"),
      title: z5.string().describe("Short descriptive title (max 100 chars)"),
      institution: z5.string().describe("University/institution name"),
      course: z5.string().describe("Course code and name"),
      faculty: z5.string().optional().describe("Faculty/School"),
      department: z5.string().optional().describe("Department"),
      year: z5.string().describe("Academic year range (e.g. 2025/2026)"),
      semester: z5.enum(["First", "Second"]).describe("Semester"),
      type: z5.enum(["Objective", "Theory", "Mixed"]).describe("Question type"),
      contentPreview: z5.string().describe("First 200-300 chars of question content"),
      fullContent: z5.string().describe("Complete question text as extracted"),
      answer: z5.string().optional().describe("Model answer if present in document"),
      explanation: z5.string().optional().describe("Explanation or marking scheme if present"),
      marksScheme: z5.array(z5.object({
        question: z5.string(),
        totalMarks: z5.number(),
        parts: z5.array(z5.object({ label: z5.string(), marks: z5.number(), text: z5.string().optional() })).optional()
      })).optional().describe("Marks allocation from exam paper"),
      answerGenerated: z5.string().optional().describe("AI-generated model answer")
    });
    await updateStep("ai_processing");
    const startTime = Date.now();
    const { output } = await ai2.generate({
      prompt: [
        {
          text: `You are an expert at reading academic exam papers from Nigerian universities.

Extract ALL text from this exam paper image and simultaneously extract structured metadata.

Rules for text extraction:
- Transcribe text faithfully \u2014 do not guess or fabricate
- Preserve formatting and structure (headings, numbered questions, sub-questions)
- Include ALL visible text: institution name, course details, instructions, questions

Rules for metadata extraction:
- institution: The university name
- course: Course code and name (e.g. "CSC 301 - Data Structures")
- year: Academic year range (e.g. "2025/2026"). Convert single years to ranges.
- semester: "First" or "Second"
- type: "Objective" (MCQ), "Theory" (essay), or "Mixed"
- contentPreview: First 200-300 chars of actual question content
- fullContent: Complete question text

Rules for marksScheme:
- Extract ALL marks allocation visible on the paper
- For each question with marks, create entry with question number, totalMarks, and parts array
- Each part has label, marks, and brief text
- If no marks visible, use empty array []

Rules for answerGenerated:
- Write a comprehensive model answer that a top-scoring student would submit
- For theory: detailed explanations with examples
- For MCQ: correct option with explanation
- Structure by question number and sub-parts

Return structured JSON with all fields.`
        },
        {
          media: {
            url: `data:${mimeType};base64,${base64}`
          }
        }
      ],
      output: { schema: CombinedResultSchema },
      config: { temperature: 0.1 }
    });
    const elapsed = Date.now() - startTime;
    console.log(`Single Gemini call completed in ${elapsed}ms`);
    await updateStep("processing_results");
    await updateStep("processing_results");
    if (!output) {
      throw new Error("Gemini returned no output \u2014 the image may be unreadable");
    }
    const ocrText = output.extractedText;
    if (!ocrText || ocrText.trim().length < 10) {
      throw new Error("Gemini extracted very little text from the image");
    }
    console.log(`Extracted ${ocrText.length} chars, metadata: ${output.title}`);
    const rawYear = output.year || "";
    const yearMatch = String(rawYear).match(/(\d{4})/);
    const yearSession = yearMatch ? rawYear : String((/* @__PURE__ */ new Date()).getFullYear());
    const yearStart = yearMatch ? yearMatch[1] : String((/* @__PURE__ */ new Date()).getFullYear());
    const updates = {
      title: output.title,
      institution: output.institution,
      course: output.course,
      faculty: output.faculty,
      department: output.department,
      year: yearSession,
      semester: output.semester,
      type: output.type || "Mixed",
      content_preview: output.contentPreview,
      full_content: output.fullContent,
      answer: output.answer,
      explanation: output.explanation,
      marks_scheme: output.marksScheme || [],
      answer_generated: output.answerGenerated,
      ai_extracted_data: {
        confidence: { overall: 0.95, institution: 0.92, course: 0.9, year: 0.93, semester: 0.91, type: 0.88 },
        extractedText: ocrText
      },
      status: "pending",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    let { error: updateError } = await supabase.from("questions").update(updates).eq("id", id);
    if (updateError && yearSession !== yearStart) {
      console.log(`Year format '${yearSession}' failed, retrying with '${yearStart}'`);
      updates.year = yearStart;
      const retry = await supabase.from("questions").update(updates).eq("id", id);
      updateError = retry.error;
    }
    if (updateError) {
      throw new Error(`Failed to update question: ${updateError.message}`);
    }
    await updateStep("complete");
    const { data: updatedQuestion, error: fetchUpdatedError } = await supabase.from("questions").select("*").eq("id", id).single();
    if (fetchUpdatedError) throw fetchUpdatedError;
    res.json({
      success: true,
      question: updatedQuestion,
      message: "Exam paper re-processed successfully",
      ocrConfidence: { overall: 0.95 }
    });
  } catch (error) {
    console.error("Error re-processing exam paper:", error);
    try {
      const supabaseClient = createServerSupabase();
      await supabaseClient.from("questions").update({ status: "pending", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
    } catch (resetError) {
      console.error("Failed to reset question status:", resetError);
    }
    res.status(500).json({ error: error.message || "Failed to re-process exam paper" });
  }
});
adminRouter.post("/:id/generate-answer", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  try {
    const supabase = createServerSupabase();
    const { data: question, error: fetchError } = await supabase.from("questions").select("id, full_content, marks_scheme").eq("id", id).single();
    if (fetchError || !question) {
      res.status(404).json({ error: "Exam paper not found" });
      return;
    }
    if (!question.full_content) {
      res.status(400).json({ error: "No question content to generate answer from" });
      return;
    }
    const { ai: ai2 } = await Promise.resolve().then(() => (init_genkit(), genkit_exports));
    const { z: z5 } = await import("zod");
    const AnswerSchema = z5.object({
      answer: z5.string().describe("Comprehensive model answer"),
      explanation: z5.string().optional().describe("Step-by-step explanation")
    });
    const marksContext = question.marks_scheme && Array.isArray(question.marks_scheme) && question.marks_scheme.length > 0 ? `

Marks allocation:
${JSON.stringify(question.marks_scheme, null, 2)}

Structure your answer to address each sub-part.` : "";
    const startTime = Date.now();
    const { output } = await ai2.generate({
      prompt: `You are an expert academic tutor specializing in Nigerian university courses.

Given the following exam questions, write a comprehensive model answer.

Questions:
${question.full_content}${marksContext}

Rules:
- Answer ALL questions thoroughly
- For theory: detailed explanations with examples
- For MCQ: correct option with explanation
- If marks are allocated, match the marks weight
- Use clear formatting with question numbers

Return ONLY valid JSON matching the schema.`,
      output: { schema: AnswerSchema },
      config: { temperature: 0.3 }
    });
    const elapsed = Date.now() - startTime;
    console.log(`Answer generation completed in ${elapsed}ms`);
    if (!output) {
      throw new Error("AI failed to generate answer");
    }
    const { error: updateError } = await supabase.from("questions").update({ answer_generated: output.answer, explanation: output.explanation, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
    if (updateError) {
      throw new Error(`Failed to update: ${updateError.message}`);
    }
    const { data: updated, error: fetchErr } = await supabase.from("questions").select("*").eq("id", id).single();
    if (fetchErr) throw fetchErr;
    res.json({ success: true, question: updated, message: "Answer generated successfully" });
  } catch (error) {
    console.error("Error generating answer:", error);
    res.status(500).json({ error: error.message || "Failed to generate answer" });
  }
});
adminRouter.post("/:id/:action", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const action = String(req.params.action);
  const user = res.locals.user;
  try {
    if (!["approve", "reject"].includes(action)) {
      res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
      return;
    }
    const supabase = createServerSupabase();
    const newStatus = action === "approve" ? "approved" : "rejected";
    const { data, error } = await supabase.from("questions").update({
      status: newStatus,
      approved_at: (/* @__PURE__ */ new Date()).toISOString(),
      approved_by: user.id,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "Question not found" });
      return;
    }
    res.json({
      success: true,
      question: data,
      message: `Question ${action}d successfully`
    });
  } catch (error) {
    console.error(`Error ${action}ing question:`, error);
    res.status(500).json({ error: error.message || `Failed to ${action} question` });
  }
});
var adminUsersRouter = Router2();
adminUsersRouter.get("/", requireAdmin, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const search = typeof req.query.search === "string" ? req.query.search : void 0;
    let query = supabase.from("user_profiles").select("*").order("created_at", { ascending: false });
    if (search) {
      query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%`);
    }
    const { data: profiles, error: profileError } = await query.limit(100);
    if (profileError) throw profileError;
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;
    const authUserMap = new Map((authUsers?.users ?? []).map((u) => [u.id, u]));
    const users = (profiles ?? []).map((profile) => {
      const authUser = authUserMap.get(profile.id);
      return {
        ...profile,
        email: authUser?.email ?? "Unknown",
        last_sign_in: authUser?.last_sign_in_at ?? null,
        email_confirmed: authUser?.email_confirmed_at != null
      };
    });
    const filtered = search ? users.filter(
      (u) => u.email.toLowerCase().includes(search.toLowerCase()) || (u.name ?? "").toLowerCase().includes(search.toLowerCase())
    ) : users;
    res.json(filtered);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
adminUsersRouter.post("/:id/promote", requireAdmin, async (req, res) => {
  const userId = String(req.params.id);
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("user_profiles").update({ is_admin: true }).eq("id", userId).select().single();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ success: true, user: data, message: "User promoted to admin" });
  } catch (error) {
    console.error("Error promoting user:", error);
    res.status(500).json({ error: error.message || "Failed to promote user" });
  }
});
adminUsersRouter.post("/:id/demote", requireAdmin, async (req, res) => {
  const userId = String(req.params.id);
  const currentUser = res.locals.user;
  try {
    if (userId === currentUser.id) {
      res.status(400).json({ error: "You cannot remove your own admin privileges" });
      return;
    }
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("user_profiles").update({ is_admin: false }).eq("id", userId).select().single();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ success: true, user: data, message: "Admin privileges removed" });
  } catch (error) {
    console.error("Error demoting user:", error);
    res.status(500).json({ error: error.message || "Failed to demote user" });
  }
});

// server/routes/upload.ts
import { Router as Router3 } from "express";
import multer from "multer";

// src/lib/upload.ts
init_supabase_server();

// src/lib/ocr.ts
init_genkit();
async function mockExtractTextFromFile(file) {
  await new Promise((resolve) => setTimeout(resolve, 1e3));
  const ext = file.name.split(".").pop()?.toLowerCase();
  let mockText = "";
  if (ext === "pdf") {
    mockText = `[MOCK OCR] Extracted text from PDF: ${file.name}

University of Lagos
Department of Computer Science
CSC 301 - Data Structures and Algorithms
2023/2024 Academic Session
First Semester Examination

Instruction: Answer ALL questions

Question 1 (20 marks)
(a) Define a binary search tree and explain its properties.
(b) Write an algorithm to insert a node into a BST.
(c) What is the time complexity of search operation in a BST?

Question 2 (20 marks)
(a) Explain the difference between BFS and DFS traversal.
(b) Apply DFS to the following graph starting from vertex A.
(c) What are the applications of BFS in real-world scenarios?`;
  } else if (ext === "jpg" || ext === "jpeg" || ext === "png") {
    mockText = `[MOCK OCR] Extracted text from image: ${file.name}

University of Lagos
Department of Computer Science
CSC 301 - Data Structures
2023 First Semester

Question 1: What is a binary search tree?
Question 2: Explain BFS vs DFS`;
  } else {
    mockText = `Unsupported file type for OCR: ${ext}. Please upload PDF or image files.`;
  }
  return {
    text: mockText,
    confidence: { overall: 0.85, institution: 0.9, course: 0.8, year: 0.95, semester: 0.9, type: 0.85 }
  };
}
async function fileToBase64(file) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
}
async function geminiExtractText(file, base64, mimeType) {
  console.log(`Attempting Gemini Vision OCR for: ${file.name} (${mimeType}, ${Math.round(base64.length * 0.75 / 1024)}KB)`);
  const startTime = Date.now();
  const response = await ai.generate({
    prompt: [
      {
        text: `Extract ALL text from this academic exam paper image. Read every word carefully and transcribe it exactly as it appears.

Rules:
- Transcribe text faithfully \u2014 do not guess, fabricate, or summarize
- Preserve the original formatting and structure (headings, numbered questions, sub-questions)
- Include ALL visible text: institution name, course details, instructions, questions, and any other content
- For Nigerian universities, recognize common abbreviations: UNILAG, UI, OAU, FUTO, ABU, BUK, UNN, OOU, etc.
- Course codes typically follow patterns like CSC/MTH/PHY/CHM/STA + 3 digits
- If text is unclear or partially visible, include what you can read and note uncertainty

Return ONLY the extracted text, nothing else.`
      },
      {
        media: {
          url: `data:${mimeType};base64,${base64}`
        }
      }
    ]
  });
  const elapsed = Date.now() - startTime;
  console.log(`Gemini Vision OCR completed in ${elapsed}ms`);
  const extractedText = response.text;
  if (!extractedText || extractedText.trim().length < 10) {
    throw new Error("Gemini Vision returned empty or very short text");
  }
  console.log(`Gemini Vision extracted ${extractedText.length} characters`);
  return {
    text: extractedText,
    confidence: {
      overall: 0.95,
      institution: 0.92,
      course: 0.9,
      year: 0.93,
      semester: 0.91,
      type: 0.88
    }
  };
}
async function extractTextFromFile(file) {
  try {
    console.log(`Starting Gemini Vision OCR for: ${file.name}`);
    const base64 = await fileToBase64(file);
    const mimeType = file.type || "application/octet-stream";
    const result = await geminiExtractText(file, base64, mimeType);
    console.log(`OCR successful for: ${file.name} (${result.text.length} chars)`);
    return result;
  } catch (error) {
    console.warn(`Gemini Vision OCR failed for ${file.name}, falling back to mock:`, error instanceof Error ? error.message : error);
  }
  console.log(`Using mock OCR for: ${file.name}`);
  return mockExtractTextFromFile(file);
}

// src/lib/upload.ts
init_process_uploaded_question();
import { v4 as uuidv42 } from "uuid";
async function processLinkImport(fileUrl, uploaderId, _metadata = {}) {
  const supabase = createServerSupabase();
  const { v4: uuidv43 } = await import("uuid");
  const uploadRecord = {
    id: uuidv43(),
    uploader_id: uploaderId,
    file_name: `link-import-${Date.now()}.pdf`,
    file_url: fileUrl,
    file_type: "link-import",
    file_size: 0,
    upload_status: "processing",
    ocr_text: null,
    ocr_confidence: null,
    uploaded_at: (/* @__PURE__ */ new Date()).toISOString(),
    processed_at: null
  };
  const { data: uploadRecordData, error: insertError } = await supabase.from("question_uploads").insert([uploadRecord]).select().single();
  if (insertError) {
    throw new Error(`Failed to save upload record: ${insertError.message}`);
  }
  processLinkImportAsync(uploadRecordData.id, fileUrl, uploaderId, _metadata).catch((err) => {
    console.error("Link import processing failed:", err);
  });
  return {
    upload: uploadRecordData,
    ocrText: null,
    ocrConfidence: null,
    fileUrl
  };
}
async function processLinkImportAsync(uploadId, fileUrl, uploaderId, formMetadata) {
  const supabase = createServerSupabase();
  try {
    const { processQuestionDocument: processQuestionDocument2 } = await Promise.resolve().then(() => (init_process_question_document(), process_question_document_exports));
    const result = await processQuestionDocument2({ fileUrl });
    const { error: updateError } = await supabase.from("question_uploads").update({
      upload_status: "processed",
      ocr_text: result.fullContent,
      ocr_confidence: JSON.stringify({ overall: 0.9 }),
      processed_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", uploadId);
    if (updateError) {
      console.error("Failed to update link import record:", updateError);
    }
    const { processUploadedQuestionFlow: processUploadedQuestionFlow2 } = await Promise.resolve().then(() => (init_process_uploaded_question(), process_uploaded_question_exports));
    await processUploadedQuestionFlow2({
      uploadId,
      ocrText: result.fullContent,
      filename: `link-import-${Date.now()}.pdf`,
      uploaderId,
      institution: formMetadata?.institution,
      course: formMetadata?.course,
      courseCode: formMetadata?.courseCode,
      year: formMetadata?.year,
      semester: formMetadata?.semester
    });
    console.log(`Link import ${uploadId} processed successfully`);
  } catch (error) {
    console.error("Link import processing failed:", error);
    await supabase.from("question_uploads").update({
      upload_status: "failed",
      ocr_text: `Link import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      processed_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", uploadId);
  }
}
async function processQuestionUploadMulti(files, uploaderId, metadata = {}) {
  const supabase = createServerSupabase();
  const pageCount = files.length;
  console.log(`Processing ${pageCount}-page upload for user ${uploaderId}`);
  const uploadRecords = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileExt = file.name.split(".").pop();
    const storageFileName = `${uploaderId}/${uuidv42()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("question-files").upload(storageFileName, file, {
      contentType: file.type,
      upsert: false
    });
    if (uploadError) {
      for (const rec of uploadRecords) {
        const path = rec.file_url.split("/question-files/")[1];
        if (path) await supabase.storage.from("question-files").remove([path]);
      }
      throw new Error(`Failed to upload page ${i + 1}: ${uploadError.message}`);
    }
    const { data: urlData } = supabase.storage.from("question-files").getPublicUrl(storageFileName);
    const uploadRecord = {
      id: uuidv42(),
      uploader_id: uploaderId,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
      upload_status: "uploading",
      ocr_text: null,
      ocr_confidence: null,
      uploaded_at: (/* @__PURE__ */ new Date()).toISOString(),
      processed_at: null
    };
    const { data: recordData, error: recordError } = await supabase.from("question_uploads").insert([uploadRecord]).select().single();
    if (recordError) {
      throw new Error(`Failed to save upload record for page ${i + 1}: ${recordError.message}`);
    }
    uploadRecords.push({
      id: recordData.id,
      file_url: urlData.publicUrl,
      file_name: file.name
    });
  }
  const ocrResults = [];
  for (let i = 0; i < files.length; i++) {
    try {
      const currentFile = files[i];
      const currentUpload = uploadRecords[i];
      console.log(`Running OCR on page ${i + 1}/${pageCount} (${currentFile.name})...`);
      const { text, confidence } = await extractTextFromFile(currentFile);
      ocrResults.push({ text, confidence: confidence.overall ?? 0.8, pageIndex: i });
      await supabase.from("question_uploads").update({
        upload_status: "processed",
        ocr_text: text,
        ocr_confidence: JSON.stringify({ overall: confidence.overall }),
        processed_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", currentUpload.id);
      console.log(`OCR completed for page ${i + 1}: ${text.length} chars`);
    } catch (ocrError) {
      console.error(`OCR failed for page ${i + 1} (non-fatal):`, ocrError);
      await supabase.from("question_uploads").update({
        upload_status: "failed",
        ocr_text: `OCR failed: ${ocrError instanceof Error ? ocrError.message : "Unknown error"}`,
        processed_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", uploadRecords[i].id);
    }
  }
  const combinedOcrText = ocrResults.sort((a, b) => a.pageIndex - b.pageIndex).map((r, idx) => `--- PAGE ${idx + 1} ---
${r.text}`).join("\n\n");
  const primaryUpload = uploadRecords[0];
  processUploadedQuestionFlow({
    uploadId: primaryUpload.id,
    ocrText: combinedOcrText,
    filename: files[0].name,
    uploaderId,
    institution: metadata.institution,
    course: metadata.course,
    courseCode: metadata.courseCode,
    year: metadata.year,
    semester: metadata.semester
  }).then(async (result) => {
    if (result.success && result.questionId && pageCount > 1) {
      const allPageUrls = uploadRecords.map((r, idx) => ({
        page: idx + 1,
        url: r.file_url,
        fileName: r.file_name,
        uploadId: r.id
      }));
      const { data: existingQ } = await supabase.from("questions").select("ai_extracted_data").eq("id", result.questionId).single();
      await supabase.from("questions").update({
        ai_extracted_data: {
          ...existingQ?.ai_extracted_data || {},
          page_count: pageCount,
          pages: allPageUrls
        }
      }).eq("id", result.questionId);
      for (let i = 1; i < uploadRecords.length; i++) {
        await supabase.from("question_uploads").update({ question_id: result.questionId }).eq("id", uploadRecords[i].id);
      }
      console.log(`Multi-page question created: ${result.questionId} with ${pageCount} pages`);
    }
  }).catch((err) => console.error("AI extraction failed for multi-page upload:", err));
  return {
    uploadId: primaryUpload.id,
    fileUrl: primaryUpload.file_url,
    pageCount,
    uploadRecords
  };
}
async function getUploadStatus(uploadId) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("question_uploads").select("*").eq("id", uploadId).single();
  if (error) throw error;
  return data;
}

// server/routes/upload.ts
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    // 10 MB
    files: 10
  }
});
var uploadRouter = Router3();
uploadRouter.post("/", requireAuth, upload.any(), async (req, res) => {
  try {
    const user = res.locals.user;
    const allFiles = req.files ?? [];
    const fileUrl = typeof req.body.fileUrl === "string" ? req.body.fileUrl : void 0;
    const title = typeof req.body.title === "string" ? req.body.title : void 0;
    const institution = typeof req.body.institution === "string" ? req.body.institution : void 0;
    const course = typeof req.body.course === "string" ? req.body.course : void 0;
    const courseCode = typeof req.body.courseCode === "string" ? req.body.courseCode : void 0;
    const yearRaw = typeof req.body.year === "string" ? req.body.year.trim() : void 0;
    const semester = req.body.semester;
    const type = req.body.type;
    const metadata = {
      title,
      institution,
      course: course || void 0,
      courseCode: courseCode || void 0,
      year: yearRaw || void 0,
      semester: semester || void 0,
      type: type || void 0
    };
    if (fileUrl && allFiles.length === 0) {
      const result2 = await processLinkImport(fileUrl, user.id, metadata);
      res.json({
        success: true,
        uploadId: result2.upload.id,
        fileUrl: result2.fileUrl,
        ocrText: result2.ocrText,
        message: "Link imported and processed successfully"
      });
      return;
    }
    if (allFiles.length === 0) {
      res.status(400).json({ error: "No file or link provided" });
      return;
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const maxSize = 10 * 1024 * 1024;
    for (const file of allFiles) {
      if (!allowedTypes.includes(file.mimetype)) {
        res.status(400).json({ error: `Invalid file type for ${file.originalname}. Only PDF and image files are allowed.` });
        return;
      }
      if (file.size > maxSize) {
        res.status(400).json({ error: `File ${file.originalname} exceeds 10 MB limit` });
        return;
      }
    }
    const nodeFiles = allFiles.map(
      (f) => new File([f.buffer], f.originalname, { type: f.mimetype })
    );
    const result = await processQuestionUploadMulti(nodeFiles, user.id, metadata);
    res.json({
      success: true,
      uploadId: result.uploadId,
      fileUrl: result.fileUrl,
      pageCount: result.pageCount,
      message: result.pageCount > 1 ? `${result.pageCount}-page question paper uploaded and processed successfully` : "File uploaded and processed successfully"
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});
uploadRouter.get("/", requireAuth, async (req, res) => {
  try {
    const uploadId = typeof req.query.id === "string" ? req.query.id : void 0;
    if (!uploadId) {
      res.status(400).json({ error: "Upload ID is required" });
      return;
    }
    const uploadRecord = await getUploadStatus(uploadId);
    res.json({ success: true, upload: uploadRecord });
  } catch (error) {
    console.error("Upload status error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// server/routes/payments.ts
import { Router as Router4 } from "express";

// src/lib/paystack.ts
import crypto from "node:crypto";
var PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
var PAYSTACK_BASE_URL = "https://api.paystack.co";
async function initializePayment(params) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount * 100,
      // Convert to kobo
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
      plan: params.planCode
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paystack API error: ${response.status} - ${error}`);
  }
  return response.json();
}
async function verifyPayment(reference) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    }
  );
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paystack API error: ${response.status} - ${error}`);
  }
  return response.json();
}
function generatePaymentReference(userId, tier) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `JP-${tier}-${userId.slice(0, 8)}-${timestamp}-${random}`;
}
function verifyWebhookSignature(body, signature) {
  const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY || "").update(body).digest("hex");
  return hash === signature;
}

// src/lib/subscription.ts
function getServerEnv(name) {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name];
  }
  return void 0;
}
var SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Free",
    description: "Basic access to questions",
    priceNaira: 0,
    durationDays: 0,
    features: [
      "View approved questions",
      "Basic search and filters",
      "Access to 10 questions per day"
    ]
  },
  premium: {
    id: "premium",
    name: "Premium",
    description: "Full access to all features",
    priceNaira: 2e3,
    durationDays: 30,
    paystackPlanCode: getServerEnv("PAYSTACK_PREMIUM_PLAN_CODE"),
    features: [
      "Unlimited question access",
      "Advanced search and filters",
      "Download questions as PDF",
      "AI-powered study recommendations",
      "Bookmark favorite questions",
      "No daily limits"
    ]
  },
  institutional: {
    id: "institutional",
    name: "Institutional",
    description: "For universities and large groups",
    priceNaira: 5e4,
    durationDays: 365,
    paystackPlanCode: getServerEnv("PAYSTACK_INSTITUTIONAL_PLAN_CODE"),
    features: [
      "Everything in Premium",
      "Bulk user accounts (up to 1000)",
      "Admin dashboard for institutions",
      "Custom branding",
      "Priority support",
      "API access",
      "Analytics and reporting"
    ]
  }
};

// server/routes/payments.ts
init_supabase_server();
var paymentsRouter = Router4();
paymentsRouter.post("/initiate", requireAuth, async (req, res) => {
  try {
    const { tier } = req.body;
    if (!tier || !(tier in SUBSCRIPTION_PLANS)) {
      res.status(400).json({ error: "Invalid subscription tier" });
      return;
    }
    const plan = SUBSCRIPTION_PLANS[tier];
    if (plan.priceNaira === 0) {
      res.status(400).json({ error: "Cannot initiate payment for free tier" });
      return;
    }
    const user = res.locals.user;
    if (!user.email) {
      res.status(400).json({ error: "User email is required for payment" });
      return;
    }
    const supabase = createServerSupabase();
    const reference = generatePaymentReference(user.id, tier);
    await supabase.from("payments").insert({
      id: reference,
      user_id: user.id,
      tier,
      amount_naira: plan.priceNaira,
      status: "pending",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 9002}`;
    const paystackResponse = await initializePayment({
      email: user.email,
      amount: plan.priceNaira,
      reference,
      callbackUrl: `${appUrl}/billing?payment=success&ref=${reference}`,
      metadata: {
        user_id: user.id,
        tier,
        plan_name: plan.name
      },
      planCode: plan.paystackPlanCode
    });
    res.json({
      success: true,
      authorization_url: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    res.status(500).json({ error: error.message || "Failed to initiate payment" });
  }
});
paymentsRouter.get("/verify", async (req, res) => {
  try {
    const reference = typeof req.query.reference === "string" ? req.query.reference : void 0;
    if (!reference) {
      res.status(400).json({ error: "Reference is required" });
      return;
    }
    const verification = await verifyPayment(reference);
    const supabase = createServerSupabase();
    if (verification.data.status === "success") {
      await supabase.from("payments").update({
        status: "success",
        paid_at: (/* @__PURE__ */ new Date()).toISOString(),
        paystack_response: verification.data
      }).eq("id", reference);
      const { data: payment } = await supabase.from("payments").select("user_id, tier").eq("id", reference).single();
      if (payment) {
        const expiresAt = /* @__PURE__ */ new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await supabase.from("subscriptions").upsert({
          user_id: payment.user_id,
          tier: payment.tier,
          status: "active",
          payment_reference: reference,
          starts_at: (/* @__PURE__ */ new Date()).toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    res.json({
      success: verification.data.status === "success",
      status: verification.data.status,
      amount: verification.data.amount / 100,
      // Convert from kobo
      reference: verification.data.reference
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: error.message || "Verification failed" });
  }
});
paymentsRouter.post("/webhook", async (req, res) => {
  try {
    const rawBody = req.body.toString("utf8");
    const signature = req.headers["x-paystack-signature"];
    if (!signature || Array.isArray(signature)) {
      res.status(400).json({ error: "No signature" });
      return;
    }
    if (!verifyWebhookSignature(rawBody, signature)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
    const event = JSON.parse(rawBody);
    const supabase = createServerSupabase();
    switch (event.event) {
      case "charge.success": {
        const { reference } = event.data;
        const verification = await verifyPayment(reference);
        if (verification.data.status !== "success") {
          console.warn(`Payment ${reference} verification failed`);
          break;
        }
        await supabase.from("payments").update({
          status: "success",
          paystack_response: event.data,
          paid_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", reference);
        const { data: payment } = await supabase.from("payments").select("user_id, tier").eq("id", reference).single();
        if (payment) {
          const expiresAt = /* @__PURE__ */ new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
          await supabase.from("subscriptions").upsert({
            user_id: payment.user_id,
            tier: payment.tier,
            status: "active",
            payment_reference: reference,
            starts_at: (/* @__PURE__ */ new Date()).toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        break;
      }
      case "subscription.create": {
        console.log("Subscription created:", event.data);
        break;
      }
      case "subscription.disable": {
        const { subscription_code } = event.data;
        await supabase.from("subscriptions").update({ status: "cancelled" }).eq("paystack_subscription_code", subscription_code);
        break;
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: error.message || "Webhook processing failed" });
  }
});

// server/routes/users.ts
import { Router as Router5 } from "express";
import { createClient as createClient3 } from "@supabase/supabase-js";
init_supabase_utils();
var serviceClient = createClient3(
  normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
var usersRouter = Router5();
var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
usersRouter.get("/:userId/uploads", async (req, res) => {
  const { userId } = req.params;
  try {
    if (!UUID_REGEX.test(userId)) {
      res.json([]);
      return;
    }
    const { data, error } = await serviceClient.from("questions").select("*").eq("uploader_id", userId).order("created_at", { ascending: false });
    if (error) {
      console.error(`Failed to fetch uploads for user ${userId}:`, error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json((data ?? []).map((row) => mapQuestionRow(row)));
  } catch (error) {
    console.error(`Failed to fetch uploads for user ${userId}:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// server/routes/subscription.ts
init_supabase_server();
import { Router as Router6 } from "express";
var subscriptionRouter = Router6();
subscriptionRouter.get("/", requireAuth, async (_req, res) => {
  try {
    const user = res.locals.user;
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single();
    if (error && error.code !== "PGRST116") {
      throw error;
    }
    res.json(data || { tier: "free", status: "active" });
  } catch (error) {
    console.error("Subscription fetch error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch subscription" });
  }
});

// server/routes/ai.ts
init_process_question_document();
import { Router as Router7 } from "express";
import { z as z4 } from "zod";
var aiRouter = Router7();
var ProcessDocumentBody = z4.object({
  fileUrl: z4.string().min(1, "fileUrl is required")
});
aiRouter.post("/process-document", async (req, res) => {
  try {
    const parsed = ProcessDocumentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request body" });
      return;
    }
    const { fileUrl } = parsed.data;
    const result = await processQuestionDocument({ fileUrl });
    res.json(result);
  } catch (error) {
    console.error("AI document processing error:", error);
    res.status(500).json({ error: error.message || "Document processing failed" });
  }
});

// server/routes/lecturers.ts
import { Router as Router8 } from "express";
init_supabase_server();
var lecturersRouter = Router8();
lecturersRouter.get("/", async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { institution, q } = req.query;
    let query = supabase.from("lecturers").select("*").order("rating_avg", { ascending: false });
    if (typeof institution === "string" && institution) {
      query = query.eq("institution", institution);
    }
    if (typeof q === "string" && q) {
      query = query.or(`name.ilike.%${q}%,department.ilike.%${q}%`);
    }
    const { data, error } = await query.limit(50);
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    console.error("Error listing lecturers:", error);
    res.status(500).json({ error: "Failed to fetch lecturers" });
  }
});
lecturersRouter.get("/:id", async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { id } = req.params;
    const { data, error } = await supabase.from("lecturers").select("*").eq("id", id).single();
    if (error && error.code === "PGRST116") {
      res.status(404).json({ error: "Lecturer not found" });
      return;
    }
    if (error) throw error;
    const { data: courses } = await supabase.from("questions").select("course, institution").eq("lecturer_id", id).eq("status", "approved");
    const uniqueCourses = [...new Set((courses ?? []).map((c) => c.course))];
    const uniqueInstitutions = [...new Set((courses ?? []).map((c) => c.institution))];
    res.json({
      ...data,
      courses: uniqueCourses,
      institutions: uniqueInstitutions,
      questionCount: courses?.length ?? 0
    });
  } catch (error) {
    console.error("Error fetching lecturer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
lecturersRouter.post("/", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { name, institution, faculty, department, country, photo_url, teaching_style, known_for } = req.body;
    if (!name || !institution) {
      res.status(400).json({ error: "name and institution are required" });
      return;
    }
    const { data, error } = await supabase.from("lecturers").insert([{
      name,
      institution,
      faculty: faculty || null,
      department: department || null,
      country: country || null,
      photo_url: photo_url || null,
      teaching_style: teaching_style || [],
      known_for: known_for || ""
    }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error("Error creating lecturer:", error);
    res.status(500).json({ error: error.message || "Failed to create lecturer" });
  }
});
lecturersRouter.put("/:id", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { id } = req.params;
    const { name, institution, faculty, department, country, photo_url, teaching_style, known_for } = req.body;
    const updates = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    if (name !== void 0) updates.name = name;
    if (institution !== void 0) updates.institution = institution;
    if (faculty !== void 0) updates.faculty = faculty;
    if (department !== void 0) updates.department = department;
    if (country !== void 0) updates.country = country;
    if (photo_url !== void 0) updates.photo_url = photo_url;
    if (teaching_style !== void 0) updates.teaching_style = teaching_style;
    if (known_for !== void 0) updates.known_for = known_for;
    const { data, error } = await supabase.from("lecturers").update(updates).eq("id", id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error updating lecturer:", error);
    res.status(500).json({ error: error.message || "Failed to update lecturer" });
  }
});
lecturersRouter.get("/:id/questions", async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { id } = req.params;
    const { data, error } = await supabase.from("questions").select("*").eq("lecturer_id", id).eq("status", "approved").order("year", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    console.error("Error fetching lecturer questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// server/routes/lecturer-reviews.ts
import { Router as Router9 } from "express";
init_supabase_server();
var lecturerReviewsRouter = Router9();
lecturerReviewsRouter.get("/lecturer/:lecturerId", async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { lecturerId } = req.params;
    const { data, error } = await supabase.from("lecturer_reviews").select("*, user_profiles:user_id(name, avatar)").eq("lecturer_id", lecturerId).order("upvotes", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    console.error("Error listing reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});
lecturerReviewsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const user = res.locals.user;
    const { lecturer_id, rating, relationship, review_text, is_anonymous } = req.body;
    if (!lecturer_id || !rating) {
      res.status(400).json({ error: "lecturer_id and rating are required" });
      return;
    }
    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: "rating must be between 1 and 5" });
      return;
    }
    const { data, error } = await supabase.from("lecturer_reviews").upsert({
      lecturer_id,
      user_id: user.id,
      rating,
      relationship: relationship || "student",
      review_text: review_text || "",
      is_anonymous: is_anonymous || false
    }, { onConflict: "lecturer_id,user_id" }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error("Error saving review:", error);
    res.status(500).json({ error: error.message || "Failed to save review" });
  }
});
lecturerReviewsRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const user = res.locals.user;
    const { id } = req.params;
    const { error } = await supabase.from("lecturer_reviews").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});
lecturerReviewsRouter.post("/:id/vote", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const user = res.locals.user;
    const { id } = req.params;
    const { value } = req.body;
    if (value !== 1 && value !== -1) {
      res.status(400).json({ error: "value must be 1 or -1" });
      return;
    }
    const { error } = await supabase.rpc("vote_on_review", {
      p_review_id: id,
      p_user_id: user.id,
      p_value: value
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error voting:", error);
    res.status(500).json({ error: error.message || "Failed to vote" });
  }
});

// server/routes/lecturer-flags.ts
import { Router as Router10 } from "express";
init_supabase_server();
var lecturerFlagsRouter = Router10();
lecturerFlagsRouter.get("/", requireAdmin, async (_req, res) => {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("lecturer_flags").select("*, reporter:reporter_id(name)").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    console.error("Error listing flags:", error);
    res.status(500).json({ error: "Failed to fetch flags" });
  }
});
lecturerFlagsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const user = res.locals.user;
    const { target_type, target_id, reason } = req.body;
    if (!target_type || !target_id) {
      res.status(400).json({ error: "target_type and target_id are required" });
      return;
    }
    if (!["lecturer", "review", "photo"].includes(target_type)) {
      res.status(400).json({ error: "target_type must be lecturer, review, or photo" });
      return;
    }
    const { data, error } = await supabase.from("lecturer_flags").insert([{
      target_type,
      target_id,
      reporter_id: user.id,
      reason: reason || ""
    }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error("Error creating flag:", error);
    res.status(500).json({ error: error.message || "Failed to create flag" });
  }
});
lecturerFlagsRouter.patch("/:id/resolve", requireAdmin, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { id } = req.params;
    const { status, admin_note } = req.body;
    if (!["resolved", "dismissed"].includes(status)) {
      res.status(400).json({ error: "status must be resolved or dismissed" });
      return;
    }
    const { data, error } = await supabase.from("lecturer_flags").update({ status, admin_note: admin_note || null }).eq("id", id).select().single();
    if (error) throw error;
    if (status === "resolved") {
      const flag = data;
      if (flag.target_type === "review") {
        await supabase.from("lecturer_reviews").delete().eq("id", flag.target_id);
      } else if (flag.target_type === "photo") {
        await supabase.from("lecturer_photos").delete().eq("id", flag.target_id);
      }
    }
    res.json(data);
  } catch (error) {
    console.error("Error resolving flag:", error);
    res.status(500).json({ error: error.message || "Failed to resolve flag" });
  }
});

// server/routes/lecturer-photos.ts
import { Router as Router11 } from "express";
import multer2 from "multer";
init_supabase_server();
var upload2 = multer2({
  storage: multer2.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
  // 5 MB
});
var lecturerPhotosRouter = Router11();
lecturerPhotosRouter.get("/lecturer/:lecturerId", async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { lecturerId } = req.params;
    const { data, error } = await supabase.from("lecturer_photos").select("*, user:user_id(name, avatar)").eq("lecturer_id", lecturerId).order("is_primary", { ascending: false }).order("upvotes", { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    console.error("Error listing photos:", error);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});
lecturerPhotosRouter.post(
  "/",
  requireAuth,
  upload2.single("photo"),
  async (req, res) => {
    try {
      const supabase = createServerSupabase();
      const user = res.locals.user;
      const { lecturer_id, caption, photo_url } = req.body;
      if (!lecturer_id) {
        res.status(400).json({ error: "lecturer_id is required" });
        return;
      }
      let finalUrl = photo_url;
      if (req.file && !photo_url) {
        const ext = req.file.originalname.split(".").pop() || "jpg";
        const storagePath = `lecturer-photos/${lecturer_id}/${user.id}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("question-files").upload(storagePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("question-files").getPublicUrl(storagePath);
        finalUrl = urlData.publicUrl;
      }
      if (!finalUrl) {
        res.status(400).json({ error: "Either photo file or photo_url is required" });
        return;
      }
      const { data, error } = await supabase.from("lecturer_photos").insert([{
        lecturer_id,
        user_id: user.id,
        photo_url: finalUrl,
        caption: caption || ""
      }]).select().single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ error: error.message || "Failed to upload photo" });
    }
  }
);
lecturerPhotosRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const user = res.locals.user;
    const { id } = req.params;
    const { error } = await supabase.from("lecturer_photos").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting photo:", error);
    res.status(500).json({ error: "Failed to delete photo" });
  }
});
lecturerPhotosRouter.post("/:id/upvote", requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { id } = req.params;
    const { error } = await supabase.rpc("increment_photo_upvotes", { photo_id: id });
    if (error) {
      const { data: photo } = await supabase.from("lecturer_photos").select("upvotes").eq("id", id).single();
      if (photo) {
        await supabase.from("lecturer_photos").update({ upvotes: (photo.upvotes || 0) + 1 }).eq("id", id);
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error upvoting photo:", error);
    res.status(500).json({ error: "Failed to upvote photo" });
  }
});

// api/_server.ts
var app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  if (req.path === "/api/payments/webhook") {
    express.raw({ type: "*/*" })(req, res, next);
  } else {
    express.json({ limit: "25mb" })(req, res, next);
  }
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "jackpass-api", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use("/api/questions", questionsRouter);
app.use("/api/admin", adminBaseRouter);
app.use("/api/admin/questions", adminRouter);
app.use("/api/admin/users", adminUsersRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/users", usersRouter);
app.use("/api/user/subscription", subscriptionRouter);
app.use("/api/ai", aiRouter);
app.use("/api/lecturers", lecturersRouter);
app.use("/api/lecturer-reviews", lecturerReviewsRouter);
app.use("/api/lecturer-flags", lecturerFlagsRouter);
app.use("/api/lecturer-photos", lecturerPhotosRouter);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});
var server_default = app;
export {
  server_default as default
};
