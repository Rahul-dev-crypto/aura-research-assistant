# Bugs to Fix - Research Assistant

## Summary of Issues Found

### 1. Research Question Generator
- ✅ Dropdown IS visible (grid layout with proper styling)
- ✅ Output format IS correct (colored badges, numbered, with rationale)
- **Issue**: Might be z-index conflict with other elements

### 2. Literature Synthesizer  
- ❌ No generate button visible after file upload
- ❌ Possible duplicate upload boxes
- **Fix needed**: Check if component has proper generate button after upload

### 3. Paper Analyzer
- ❌ Duplicate upload boxes
- ❌ No generate button after upload
- **Fix needed**: Remove duplicate upload, add generate button

### 4. Text Refiner
- ❌ Duplicate upload boxes  
- ❌ Auto-extraction not starting after upload
- **Fix needed**: Single upload box, auto-extract on upload

### 5. Plagiarism Checker
- ❌ Generate button not clickable after upload
- ❌ Paste text option not auto-extracting
- **Fix needed**: Make button clickable, auto-extract from textarea

### 6. Keyword Extractor
- ❌ Similar issues to plagiarism checker
- **Fix needed**: Same as plagiarism checker

## Root Causes

1. **Duplicate Upload Boxes**: Components have both:
   - Global file upload at top (from ResearchWizard)
   - Component-specific upload (from individual tool components)

2. **Missing Generate Buttons**: Some tools don't show generate button because:
   - They're excluded from the main generate button logic
   - They don't have their own generate button implemented

3. **Auto-extraction Not Working**: File upload handlers not triggering extraction automatically

## Solution Approach

Since these are standalone components (LiteratureSynthesizer, PaperAnalyzer, TextRefiner, etc.), they should:
1. Have their OWN upload button (not rely on ResearchWizard's global upload)
2. Have their OWN generate/analyze button
3. Auto-extract text when file is uploaded
4. Be self-contained and not depend on ResearchWizard state

The ResearchWizard should ONLY show the global upload for tasks that don't have standalone components.

## Files to Update

1. `LiteratureSynthesizer.tsx` - Add visible generate button
2. `PaperAnalyzer.tsx` - Remove duplicate upload, add generate button  
3. `TextRefiner.tsx` - Single upload, auto-extract
4. `ResearchWizard.tsx` - Hide global upload for standalone components
5. Check all dropdown z-index issues

