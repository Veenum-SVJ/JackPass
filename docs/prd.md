# Product Requirements Document: JackPass

## 1. Introduction

This document outlines the requirements for JackPass, a mobile and web application designed to provide students with easy access to a searchable database of past examination questions. The app aims to simplify the process of finding relevant study materials and provide an intuitive platform for users to contribute by uploading new questions.

## 2. Goals

*   Provide students with a comprehensive and easily searchable database of past examination questions.
*   Enable users to view questions and their corresponding answers and explanations in an interactive format.
*   Facilitate the contribution of new past questions by users through simple upload or camera capture.
*   Leverage AI-powered OCR to automate the extraction of relevant information from uploaded question images.
*   Enhance the studying experience by suggesting related question papers.
*   Maintain a consistent and user-friendly interface following defined style guidelines.

## 3. User Stories

*   As a student, I want to be able to search for past exam questions by institution, course, faculty, year, semester, question type, and keywords so that I can quickly find the materials I need to study.
*   As a student, I want to view a past question and its answer/explanation and be able to toggle the answer visibility so that I can test myself before seeing the solution.
*   As a student, I want to easily navigate between questions within a paper or related papers.
*   As a student, I want to be able to upload scanned past questions or take photos of them directly within the app so that I can contribute to the database.
*   As a user uploading a question, I want the app to automatically extract text and suggest institution/course names from the image using AI so that I don't have to manually type everything.
*   As an admin, I want to approve uploaded questions before they become available to all users.
*   As a student, I want to see suggestions for other relevant past questions based on the one I am currently viewing.
*   As a user, I want the app to have a clean, professional, and easy-to-read interface.

## 4. Features

*   **Advanced Question Search:**
    *   Search bar with filtering options: Institution Name, Course Name, Faculty/Department, Year of Exam, Semester, Question Type, Keyword.
    *   Filters should be combinable.
    *   Search results displayed in a card-based layout.
    *   Fixed search bar visible on relevant pages.
*   **Interactive Question Viewer:**
    *   Display of question text, associated answers, and detailed explanations.
    *   Toggle button to show/hide answers and explanations.
    *   Navigation controls to move to the next/previous question within a paper.
    *   Links or access points to view related questions.
*   **Easy Question Upload:**
    *   Persistent footer bar with a prominent "Upload Past Question" button.
    *   Option to upload existing image files (scanned documents, photos).
    *   Option to use the device camera to capture new questions.
    *   Form to provide additional metadata (Institution, Course, Year, Semester, etc.).
    *   Uploads are subject to admin approval before being published.
*   **AI-Powered OCR Text Extraction with Auto-suggestions:**
    *   Integration with Google Vision API for OCR on uploaded images.
    *   Automatic text extraction from question images.
    *   Identification of institution and course names within the extracted text.
    *   Auto-population and suggestions for Institution and Course dropdown fields based on OCR results.
    *   Validation against a list of approved institutions.
*   **Related Questions:**
    *   Algorithm to identify and display question papers related to the currently viewed paper based on metadata (institution, course, year, topic, etc.).
    *   List of related questions displayed prominently on the Question Viewer page.

## 5. Design Guidelines

*   **Primary Color:** Deep sky blue (#3498DB)
*   **Background Color:** Light gray (#ECF0F1)
*   **Accent Color:** Sunflower yellow (#F1C40F)
*   **Body and Headline Font:** 'Inter' (sans-serif)
*   **Code Font:** 'Source Code Pro'
*   **Icons:** Use consistent and professional icons from a library like FontAwesome.
*   **Layout:**
    *   Fixed search bar at the top of relevant pages.
    *   Persistent footer bar with the upload button.
    *   Card-based layout for displaying question listings.
    *   Clean and professional visual style.

## 6. Future Considerations

*   User accounts and profiles to track contributions and saved questions.
*   Rating and commenting system for questions and answers.
*   Support for different file formats for uploads (e.g., PDF).
*   Integration with educational platforms or learning management systems.
*   Advanced analytics for user behavior and popular questions.
*   Offline access to downloaded question papers.
*   Gamification elements to encourage user contributions.