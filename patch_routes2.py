import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add imports
if "MaterialsRouter" not in content:
    content = content.replace(
        "import AIAssistant from './components/ai/AIAssistant';",
        "import AIAssistant from './components/ai/AIAssistant';\nimport ManageMaterials from './pages/dashboard/ManageMaterials';\nimport StudentMaterials from './pages/dashboard/StudentMaterials';\nimport { useOutletContext } from 'react-router-dom';\n\nconst MaterialsRouter = () => {\n  const { user } = useOutletContext<any>();\n  return user?.role === 'student' ? <StudentMaterials /> : <ManageMaterials />;\n};\n"
    )

# Add route for Admin/Student Dashboard
if "path=\"materials\"" not in content:
    content = content.replace(
        "<Route path=\"analytics\" element={<Analytics />} />",
        "<Route path=\"analytics\" element={<Analytics />} />\n          <Route path=\"materials\" element={<MaterialsRouter />} />"
    )

    # For Moderator and Faculty, they just need ManageMaterials, but they could use MaterialsRouter too since their role isn't 'student'
    content = content.replace(
        "<Route path=\"students\" element={<ManageStudents />} />\n        </Route>",
        "<Route path=\"students\" element={<ManageStudents />} />\n          <Route path=\"materials\" element={<MaterialsRouter />} />\n        </Route>"
    )

with open('src/App.tsx', 'w') as f:
    f.write(content)
