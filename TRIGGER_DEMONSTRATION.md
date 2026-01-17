# Database Trigger Demonstration Script

## Quick Reference for Viva Presentation

### Step-by-Step Trigger Demo

#### 1. Show Trigger Definition (30 seconds)

```sql
-- Show trigger exists
SELECT 
    tgname AS trigger_name,
    tgtype,
    tgenabled,
    tgrelid::regclass AS table_name
FROM pg_trigger 
WHERE tgname = 'check_teacher_eligibility';

-- Show trigger function code
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'check_teacher_eligibility_fn';
```

#### 2. Setup Test Data (1 minute)

```sql
-- Create specialty
INSERT INTO specialties (specialty_name, description) 
VALUES ('Database Systems', 'Database design and management skills')
ON CONFLICT (specialty_name) DO NOTHING;

-- Create course
INSERT INTO courses (code, title, description, credits) 
VALUES ('CS301', 'Database Systems', 'Advanced database concepts', 3)
ON CONFLICT (code) DO NOTHING;

-- Link course to specialty requirement
INSERT INTO course_requirements (course_id, specialty_id)
SELECT 
    c.course_id,
    s.specialty_id
FROM courses c, specialties s
WHERE c.code = 'CS301' AND s.specialty_name = 'Database Systems'
ON CONFLICT DO NOTHING;

-- Get a teacher ID (use existing or create one)
SELECT teacher_id, user_id FROM teachers LIMIT 1;
-- Note the teacher_id for next steps (e.g., teacher_id = 1)
```

#### 3. Demonstrate Trigger Blocking Invalid Assignment (1 minute)

```sql
-- Check teacher's current specialties
SELECT 
    t.teacher_id,
    s.specialty_name
FROM teachers t
LEFT JOIN teacher_specialties ts ON t.teacher_id = ts.teacher_id
LEFT JOIN specialties s ON ts.specialty_id = s.specialty_id
WHERE t.teacher_id = 1;

-- Try to assign teacher WITHOUT required specialty
INSERT INTO teaching_assignments (teacher_id, course_id, term, section, status)
VALUES (
    1,  -- teacher_id (replace with actual)
    (SELECT course_id FROM courses WHERE code = 'CS301'),
    'Fall 2024',
    '01',
    'pending'
);
```

**Expected Error**:
```
ERROR: Teacher does not meet eligibility requirements for this course
```

**Explain**: "The trigger detected that this teacher doesn't have the 'Database Systems' specialty required by CS301, so it prevented the insertion."

#### 4. Add Required Specialty (30 seconds)

```sql
-- Add the specialty to teacher
INSERT INTO teacher_specialties (teacher_id, specialty_id)
SELECT 
    1,  -- teacher_id
    specialty_id
FROM specialties
WHERE specialty_name = 'Database Systems'
ON CONFLICT DO NOTHING;

-- Verify teacher now has the specialty
SELECT 
    t.teacher_id,
    s.specialty_name
FROM teachers t
JOIN teacher_specialties ts ON t.teacher_id = ts.teacher_id
JOIN specialties s ON ts.specialty_id = s.specialty_id
WHERE t.teacher_id = 1;
```

#### 5. Demonstrate Trigger Allowing Valid Assignment (1 minute)

```sql
-- Now try to assign teacher WITH required specialty
INSERT INTO teaching_assignments (teacher_id, course_id, term, section, status)
VALUES (
    1,  -- teacher_id
    (SELECT course_id FROM courses WHERE code = 'CS301'),
    'Fall 2024',
    '01',
    'pending'
);
```

**Expected Result**:
```
INSERT 0 1
```

**Explain**: "Now the trigger checked the eligible_teachers_for_course view, found the teacher has all required specialties, and allowed the insertion."

#### 6. Show the View (30 seconds)

```sql
-- Show eligible teachers for the course
SELECT 
    et.teacher_id,
    t.user_id,
    u.full_name,
    c.code AS course_code,
    c.title AS course_title
FROM eligible_teachers_for_course et
JOIN teachers t ON et.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.user_id
JOIN courses c ON et.course_id = c.course_id
WHERE c.code = 'CS301';
```

#### 7. Explain Admin Bypass (1 minute)

```sql
-- Show how admin can force assign (bypass trigger)
-- This is done in the application code, but you can show the SQL:

BEGIN;
ALTER TABLE teaching_assignments DISABLE TRIGGER check_teacher_eligibility;

INSERT INTO teaching_assignments (teacher_id, course_id, term, section, status)
VALUES (1, (SELECT course_id FROM courses WHERE code = 'CS301'), 'Fall 2024', '01', 'approved');

ALTER TABLE teaching_assignments ENABLE TRIGGER check_teacher_eligibility;
COMMIT;
```

**Explain**: "For administrative override, we temporarily disable the trigger, insert the assignment, then re-enable it. This is intentional for cases where admin needs to override the automatic check."

### Key Talking Points

1. **Why Triggers?**
   - "We use triggers to enforce business rules at the database level, ensuring data integrity regardless of how data is inserted."

2. **How It Works**
   - "The trigger fires BEFORE INSERT, checks if the teacher is in the eligible_teachers_for_course view, and raises an exception if not eligible."

3. **The View**
   - "The eligible_teachers_for_course view uses a complex query to find teachers who have ALL required specialties for a course."

4. **Security**
   - "This prevents invalid assignments even if application code has bugs or if someone tries to insert data directly into the database."

5. **Flexibility**
   - "Courses without requirements can be assigned to any teacher. The trigger only enforces rules when requirements exist."

### Common Questions & Quick Answers

**Q: What happens if a course has multiple requirements?**  
A: "The view checks that the teacher has ALL required specialties. If even one is missing, the teacher won't appear in the view and the trigger will block the assignment."

**Q: Can you modify the trigger?**  
A: "Yes, we can use `CREATE OR REPLACE FUNCTION` to update the trigger function, then the trigger automatically uses the new function."

**Q: What's the performance impact?**  
A: "Minimal. The trigger executes a simple EXISTS check against an indexed view. The view itself is optimized with proper indexes on foreign keys."

**Q: Why not just check in application code?**  
A: "Application-level checks can be bypassed, forgotten, or have bugs. Database triggers ensure the rule is always enforced, regardless of how data enters the system."

---

## Quick Demo Checklist

- [ ] Show trigger definition
- [ ] Show trigger function code
- [ ] Create test data (course, specialty, requirement)
- [ ] Attempt invalid assignment → Show error
- [ ] Add specialty to teacher
- [ ] Attempt valid assignment → Show success
- [ ] Show eligible_teachers_for_course view
- [ ] Explain admin bypass mechanism
- [ ] Answer questions about trigger design

**Total Time: ~5-7 minutes**

