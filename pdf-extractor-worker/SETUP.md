# PDF Extraction Setup Guide

## ✅ What's Ready

I've created the complete PDF extraction Worker at `d:\apps\game\pdf-extractor-worker\`:
- Full pdfjs-dist implementation (browser-compatible PDF parser)
- 7 book configurations ready
- Dependencies installed

## 🔧 Manual Steps Needed (API Token Permissions)

Run these commands from `d:\apps\game\`:

### 1. Create R2 Bucket
```bash
wrangler r2 bucket create ielts-pdfs
```

### 2. Upload All 7 PDFs (Copy entire block)
```bash
wrangler r2 object put ielts-pdfs/Cambridge_Grammar_for_IELTS.pdf --file Cambridge_Grammar_for_IELTS_with_answers_Hopkins_Diane_Cullen_Pauline_2008_-272p.pdf

wrangler r2 object put ielts-pdfs/Cambridge_Vocabulary_for_IELTS.pdf --file Cambridge_Vocabulary_for_IELTS.pdf

wrangler r2 object put ielts-pdfs/The_Key_to_IELTS_Academic_Writing_Task_1.pdf --file The_Key_to_IELTS_Academic_Writing_Task_1.pdf

wrangler r2 object put ielts-pdfs/THE_KEY_TO_IELTS_WRITING.pdf --file THE_KEY_TO_IELTS_WRITING_-_PAULINE_CULLEN.pdf

wrangler r2 object put ielts-pdfs/Key_to_IELTS_Success_2021.pdf --file Key-to-IELTS-Success-2021.pdf

wrangler r2 object put ielts-pdfs/Common_Mistakes_at_IELTS_Advanced.pdf --file Common_Mistakes_at_IELTS_Advanced.pdf

wrangler r2 object put ielts-pdfs/Common_Mistakes_at_IELTS_Intermediate.pdf --file Common_Mistakes_at_IELTS_Intermediate.pdf
```

### 3. Get D1 Database ID
```bash
wrangler d1 list
```
Copy the database ID for `babel-frontier-db`

### 4. Run This Command
Tell me the database ID from step 3, and paste it here, then I'll deploy automatically.

## ⏱️ Time Estimate
- Commands: 5 minutes
- Deployment: 30 seconds (I'll do this)
- Extraction: 3-5 minutes (automated HTTP trigger)
