import re

with open('src/components/layout/FacultyDashboardLayout.tsx', 'r') as f:
    content = f.read()

# Add Materials to facultyNav
if "name: 'Materials'" not in content:
    content = content.replace(
        "{ name: 'My Students', href: '/faculty-dashboard/students', icon: Users },",
        "{ name: 'My Students', href: '/faculty-dashboard/students', icon: Users },\n    { name: 'Materials', href: '/faculty-dashboard/materials', icon: BookOpen },"
    )

with open('src/components/layout/FacultyDashboardLayout.tsx', 'w') as f:
    f.write(content)
