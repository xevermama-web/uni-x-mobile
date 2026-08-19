import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add imports
if "ManageMaterials" not in content:
    content = content.replace(
        "import AIAssistant from './components/ai/AIAssistant';",
        "import AIAssistant from './components/ai/AIAssistant';\nimport ManageMaterials from './pages/dashboard/ManageMaterials';\nimport StudentMaterials from './pages/dashboard/StudentMaterials';"
    )

# Add route for Admin Dashboard
if "path=\"materials\"" not in content[:content.find('path="/moderator-dashboard"')]:
    content = content.replace(
        "<Route path=\"analytics\" element={<Analytics />} />",
        "<Route path=\"analytics\" element={<Analytics />} />\n          <Route path=\"materials\" element={<ManageMaterials />} />"
    )

# Add route for Moderator Dashboard
mod_dashboard_idx = content.find('path="/moderator-dashboard"')
fac_dashboard_idx = content.find('path="/faculty-dashboard"')
mod_section = content[mod_dashboard_idx:fac_dashboard_idx]
if "path=\"materials\"" not in mod_section:
    new_mod_section = mod_section.replace(
        "<Route path=\"analytics\" element={<Analytics />} />",
        "<Route path=\"analytics\" element={<Analytics />} />\n          <Route path=\"materials\" element={<ManageMaterials />} />"
    )
    content = content[:mod_dashboard_idx] + new_mod_section + content[fac_dashboard_idx:]

# Add route for Faculty Dashboard
fac_dashboard_idx = content.find('path="/faculty-dashboard"')
fac_section = content[fac_dashboard_idx:]
if "path=\"materials\"" not in fac_section:
    new_fac_section = fac_section.replace(
        "<Route path=\"students\" element={<ManageStudents />} />",
        "<Route path=\"students\" element={<ManageStudents />} />\n          <Route path=\"materials\" element={<ManageMaterials />} />"
    )
    content = content[:fac_dashboard_idx] + new_fac_section

# We need to render StudentMaterials for students.
# The Admin and Student share `<Route path="/dashboard" element={<DashboardLayout />}>`.
# Wait, if both Admin and Student use `/dashboard/materials`, Admin gets ManageMaterials and Student gets StudentMaterials.
# We can do this inside `DashboardLayout`? Or we can create a proxy component `MaterialsRouteProxy.tsx`?
# Or even easier, modify `ManageMaterials.tsx` to return `StudentMaterials` if the role is student.
# Let's write `MaterialsRouter.tsx` or just inline it in App.
