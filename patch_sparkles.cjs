const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/DashboardHome.tsx', 'utf-8');

const target = `              {/* Sparkles
              <Sparkles
            </div>`;
const replacement = `              <Sparkles className="absolute top-0 right-0 w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            </div>`;

code = code.split(target).join(replacement);
fs.writeFileSync('src/pages/dashboard/DashboardHome.tsx', code);
