import re

with open('src/components/layout/ModeratorDashboardLayout.tsx', 'r') as f:
    content = f.read()

# Add Materials to navigation
if "name: 'Materials'" not in content:
    content = content.replace(
        "{ name: 'Analytics', href: '/moderator-dashboard/analytics', icon: Calendar },",
        "{ name: 'Materials', href: '/moderator-dashboard/materials', icon: BookOpen },\n    { name: 'Analytics', href: '/moderator-dashboard/analytics', icon: Calendar },"
    )

with open('src/components/layout/ModeratorDashboardLayout.tsx', 'w') as f:
    f.write(content)
