
# Simulation of Frontend Logic with Real Data
modules = [
    {"id": "11380c2e-d1f4-41f8-8c2a-7696cf2f7c8b", "title": "Lesson 1: Introduction to Certifications", "type": "pdf"},
    {"id": "507c2402-63d5-4365-ae49-93221f6d07a6", "title": "Final Exam", "type": "quiz"}
]

# Transform to Frontend Course Structure
sections = [
    {
        "id": "all-modules",
        "lessons": [
            {"id": "11380c2e-d1f4-41f8-8c2a-7696cf2f7c8b", "title": "Lesson 1: Introduction to Certifications"},
            {"id": "507c2402-63d5-4365-ae49-93221f6d07a6", "title": "Final Exam"}
        ]
    }
]

completed_lessons = set() # Empty set for new user

def is_lesson_locked(lesson):
    title = lesson["title"].lower().strip()
    if "final exam" in title or "grand exam" in title:
        print(f"Checking lock for: {title}")
        all_others_complete = True
        
        for s in sections:
            for l in s["lessons"]:
                l_title = l["title"].lower().strip()
                if "final exam" not in l_title and "grand exam" not in l_title:
                    if l["id"] not in completed_lessons:
                        print(f"  - Prerequisite NOT met: {l['title']}")
                        all_others_complete = False
        
        return not all_others_complete
    return False

# Test
exam = sections[0]["lessons"][1]
locked = is_lesson_locked(exam)
print(f"Final Exam Locked? {locked}")
