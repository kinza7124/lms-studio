/**
 * Plagiarism Checking Service
 * 
 * This service provides plagiarism detection for quiz and assignment submissions.
 * For production, you would integrate with services like:
 * - Turnitin API
 * - Copyscape API
 * - Grammarly API
 * - Custom ML-based solution
 * 
 * For now, this is a mock implementation that simulates plagiarism checking.
 */

const checkPlagiarism = async (text, fileUrls = []) => {
  try {
    // Mock plagiarism check - in production, this would call an actual API
    // For text-based submissions
    let plagiarismScore = 0;
    let report = {
      sources: [],
      similarity: 0,
      checkedAt: new Date().toISOString(),
    };

    if (text && text.length > 0) {
      // Simulate checking text against a database
      // In production, this would use an actual plagiarism detection service
      const textLength = text.length;
      const wordCount = text.split(/\s+/).length;
      
      // Mock: Random plagiarism score between 0-30% for demonstration
      // In production, this would be the actual similarity percentage
      plagiarismScore = Math.floor(Math.random() * 30);
      
      if (plagiarismScore > 0) {
        report.sources = [
          {
            url: 'https://example.com/source1',
            similarity: plagiarismScore,
            matchedText: text.substring(0, 100) + '...',
          },
        ];
        report.similarity = plagiarismScore;
      }
    }

    // For file-based submissions (PDFs, documents)
    if (fileUrls && fileUrls.length > 0) {
      // In production, you would:
      // 1. Download the files
      // 2. Extract text from PDFs/DOCs
      // 3. Send to plagiarism API
      // 4. Get similarity scores
      
      // Mock: Add file-based plagiarism check
      const filePlagiarismScore = Math.floor(Math.random() * 25);
      if (filePlagiarismScore > plagiarismScore) {
        plagiarismScore = filePlagiarismScore;
        report.sources.push({
          url: fileUrls[0],
          similarity: filePlagiarismScore,
          type: 'file',
        });
        report.similarity = filePlagiarismScore;
      }
    }

    return {
      plagiarismScore,
      plagiarismChecked: true,
      plagiarismReport: JSON.stringify(report),
    };
  } catch (error) {
    console.error('Plagiarism check error:', error);
    return {
      plagiarismScore: null,
      plagiarismChecked: false,
      plagiarismReport: JSON.stringify({ error: error.message }),
    };
  }
};

/**
 * Check plagiarism for multiple submissions (batch processing)
 */
const checkPlagiarismBatch = async (submissions) => {
  const results = [];
  for (const submission of submissions) {
    const result = await checkPlagiarism(
      submission.submission_text || submission.answers,
      submission.file_urls || [submission.file_url]
    );
    results.push({
      submissionId: submission.submission_id,
      ...result,
    });
  }
  return results;
};

/**
 * Compare two student submissions for plagiarism
 * Calculates similarity between two submissions
 */
const compareSubmissions = async (submission1, submission2) => {
  try {
    let similarity = 0;
    const matches = [];
    
    // Extract text from both submissions
    const text1 = (submission1.submission_text || '').toLowerCase().trim();
    const text2 = (submission2.submission_text || '').toLowerCase().trim();
    
    if (!text1 || !text2) {
      return {
        similarity: 0,
        matches: [],
        message: 'One or both submissions have no text content',
      };
    }
    
    // Simple word-based similarity calculation
    // In production, use more sophisticated algorithms (Levenshtein, Jaccard, etc.)
    const words1 = text1.split(/\s+/).filter(w => w.length > 3); // Filter short words
    const words2 = text2.split(/\s+/).filter(w => w.length > 3);
    
    if (words1.length === 0 || words2.length === 0) {
      return {
        similarity: 0,
        matches: [],
        message: 'Insufficient text content for comparison',
      };
    }
    
    // Calculate word overlap
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    // Jaccard similarity coefficient
    similarity = (intersection.size / union.size) * 100;
    
    // Find matching phrases (3+ consecutive words)
    const phrases1 = [];
    const phrases2 = [];
    
    for (let i = 0; i <= words1.length - 3; i++) {
      phrases1.push(words1.slice(i, i + 3).join(' '));
    }
    for (let i = 0; i <= words2.length - 3; i++) {
      phrases2.push(words2.slice(i, i + 3).join(' '));
    }
    
    const matchingPhrases = phrases1.filter(p => phrases2.includes(p));
    
    if (matchingPhrases.length > 0) {
      matches.push({
        type: 'text',
        matchedPhrases: matchingPhrases.slice(0, 5), // Limit to 5 matches
        count: matchingPhrases.length,
      });
    }
    
    // Check file similarity if both have files
    if (submission1.file_urls && submission2.file_urls && 
        submission1.file_urls.length > 0 && submission2.file_urls.length > 0) {
      // In production, you would:
      // 1. Download both files
      // 2. Extract text from PDFs/DOCs
      // 3. Compare extracted text
      // For now, we'll just note that both have files
      matches.push({
        type: 'file',
        message: 'Both submissions contain files. File content comparison requires file processing.',
      });
    }
    
    return {
      similarity: Math.round(similarity * 100) / 100, // Round to 2 decimal places
      matches,
      submission1Id: submission1.submission_id,
      submission2Id: submission2.submission_id,
      submission1Student: submission1.student_name || 'Student 1',
      submission2Student: submission2.student_name || 'Student 2',
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Plagiarism comparison error:', error);
    return {
      similarity: null,
      matches: [],
      error: error.message,
    };
  }
};

/**
 * Check plagiarism for all submissions in an assignment
 * Compares each submission against all others
 */
const checkAssignmentPlagiarism = async (submissions) => {
  const results = [];
  
  // Only check submissions that have text content
  const submissionsWithText = submissions.filter(s => 
    s.submission_text && s.submission_text.trim().length > 0
  );
  
  for (let i = 0; i < submissionsWithText.length; i++) {
    for (let j = i + 1; j < submissionsWithText.length; j++) {
      const comparison = await compareSubmissions(
        submissionsWithText[i],
        submissionsWithText[j]
      );
      
      if (comparison.similarity > 0) {
        results.push(comparison);
      }
    }
  }
  
  // Sort by similarity (highest first)
  results.sort((a, b) => b.similarity - a.similarity);
  
  return results;
};

module.exports = {
  checkPlagiarism,
  checkPlagiarismBatch,
  compareSubmissions,
  checkAssignmentPlagiarism,
};

