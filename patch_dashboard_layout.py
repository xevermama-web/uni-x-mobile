import re

with open('src/components/layout/DashboardLayout.tsx', 'r') as f:
    content = f.read()

# Add Materials to adminNav
if "name: 'Materials'" not in content:
    content = content.replace(
        "{ name: 'Analytics', href: '/dashboard/analytics', icon: Calendar },",
        "{ name: 'Materials', href: '/dashboard/materials', icon: BookOpen },\n    { name: 'Analytics', href: '/dashboard/analytics', icon: Calendar },"
    )

# Add Materials to studentNav
if "{ name: 'Materials'" not in content[:content.find('adminNav')]:
    content = content.replace(
        "{ name: 'Study Groups', href: '/dashboard/groups', icon: Users },",
        "{ name: 'Study Groups', href: '/dashboard/groups', icon: Users },\n    { name: 'Materials', href: '/dashboard/materials', icon: BookOpen },"
    )

with open('src/components/layout/DashboardLayout.tsx', 'w') as f:
    f.write(content)
