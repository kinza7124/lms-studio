# Transaction Support Implementation

## Overview

This document describes the implementation of database transaction support (ROLLBACK/COMMIT) for critical operations in the LMS system. Transactions ensure data integrity by making multi-step database operations atomic - either all operations succeed or all are rolled back.

## Implementation

### Transaction Utility

A reusable transaction utility has been created at `backend/src/utils/transaction.js`:

- **`withTransaction(callback)`**: Executes a callback function within a database transaction
- **`executeTransaction(queries)`**: Executes multiple queries in a single transaction

### Operations Using Transactions

#### 1. Course Creation with Requirements
**File**: `backend/src/controllers/courseController.js`
- **Operation**: Creating a course and adding specialty requirements
- **Why**: If adding requirements fails, the course should not be created in an incomplete state
- **Transaction Scope**: Course creation + all requirement additions

#### 2. User Registration
**File**: `backend/src/controllers/authController.js`
- **Operation**: Creating user, profile (student/teacher), and specialty tags
- **Why**: If profile creation or specialty assignment fails, the user account should not be left in an incomplete state
- **Transaction Scope**: User creation + profile creation + specialty tag assignments + verification token

#### 3. Assignment Submission with Plagiarism Check
**File**: `backend/src/controllers/submissionController.js`
- **Operation**: Creating submission and updating plagiarism check results
- **Why**: Submission and plagiarism data should be stored together atomically
- **Transaction Scope**: Submission creation + plagiarism check update

#### 4. Grading with Notification
**File**: `backend/src/controllers/submissionController.js`
- **Operation**: Updating submission grade and creating notification
- **Why**: If notification creation fails, the grade update should be rolled back to maintain consistency
- **Transaction Scope**: Grade update + notification creation

#### 5. Force Teacher Assignment (Already Implemented)
**File**: `backend/src/models/teachingAssignmentModel.js`
- **Operation**: Temporarily disabling trigger, creating assignment, re-enabling trigger
- **Why**: Trigger state must be restored even if assignment creation fails
- **Transaction Scope**: Trigger disable + assignment creation + trigger enable

## Benefits

1. **Data Integrity**: Ensures database remains in a consistent state
2. **Atomicity**: Multi-step operations either fully succeed or fully fail
3. **Error Recovery**: Automatic rollback on errors prevents partial data
4. **Consistency**: Related data is always created/updated together

## Example Usage

```javascript
const { withTransaction } = require('../utils/transaction');

// Example: Creating course with requirements
const course = await withTransaction(async (client) => {
  // Create course
  const courseResult = await client.query(
    'INSERT INTO courses (...) VALUES (...) RETURNING *',
    [...]
  );
  
  // Add requirements
  for (const specialtyId of specialtyIds) {
    await client.query(
      'INSERT INTO course_requirements (...) VALUES (...)',
      [...]
    );
  }
  
  return courseResult.rows[0];
});
```

## Error Handling

All transactions automatically:
- **BEGIN** transaction before executing operations
- **COMMIT** transaction if all operations succeed
- **ROLLBACK** transaction if any operation fails
- **Release** database client connection in finally block

## Testing

To test transaction rollback:

1. **Course Creation**: Try creating a course with an invalid specialty ID - course should not be created
2. **User Registration**: Try registering with invalid data - user should not be created
3. **Submission**: Simulate database error during submission - submission should not be created
4. **Grading**: Simulate notification creation failure - grade should not be updated

## Future Enhancements

Consider adding transactions to:
- Quiz creation with questions
- Assessment creation
- Bulk operations (enrolling multiple students)
- Course deletion (cascade operations)

## Notes

- Transactions use PostgreSQL's native transaction support
- Each transaction uses a dedicated database client connection
- Connections are properly released even on errors
- Long-running operations should be avoided within transactions

